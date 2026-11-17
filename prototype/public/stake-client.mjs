export const MONEY_UNIT=1000000;
export function rgsOrigin(host) {
  if(!host||!/^([a-z\d-]+\.)*[a-z\d-]+(?::\d{1,5})?$/i.test(host))throw Error('Invalid rgs_url. Expected a server hostname.');
  return `https://${host}`;
}
export function allowedAmounts(config) {
  const {minBet,maxBet,stepBet,defaultBetLevel}=config||{};
  if(![minBet,maxBet,stepBet,defaultBetLevel].every(Number.isSafeInteger)||minBet<=0||maxBet<minBet||stepBet<=0)throw Error('Invalid server bet configuration');
  const explicit=Array.isArray(config.betLevels)&&config.betLevels.length;
  const first=Math.ceil(minBet/stepBet)*stepBet;
  const values=explicit?[...new Set(config.betLevels)]:Array.from({length:Math.max(0,Math.min(10000,Math.floor((maxBet-first)/stepBet)+1))},(_,i)=>first+i*stepBet);
  if(!explicit&&!values.includes(defaultBetLevel))values.push(defaultBetLevel);
  if(values.some(n=>!Number.isSafeInteger(n)||n<minBet||n>maxBet||n%stepBet!==0)||!values.includes(defaultBetLevel))throw Error('Server bet levels do not match its limits');
  return values.sort((a,b)=>a-b);
}
export function createStakeClient({search,fetcher=fetch,storage=globalThis.localStorage}={}) {
  const params=new URLSearchParams(search||'');
  const replay=params.get('replay')==='true', remote=replay||params.has('rgs_url')||params.has('sessionID');
  if(!remote)return null;
  const origin=rgsOrigin(params.get('rgs_url')),sessionID=params.get('sessionID');
  if(!replay&&!sessionID)throw Error('Missing sessionID');
  let config,auth,active=null,settlementUncertain=false;
  const key=`ninth-rgs-pending:${origin}:${sessionID}`;
  const call=async(path,payload)=>{
    const response=await fetcher(origin+path,{method:payload===undefined?'GET':'POST',headers:payload===undefined?{}:{'Content-Type':'application/json'},...(payload===undefined?{}:{body:JSON.stringify(payload)}),signal:AbortSignal.timeout(20000)});
    const text=await response.text();let data;try{data=text?JSON.parse(text):{};}catch{if(!response.ok)throw Object.assign(Error(`Server error ${response.status}`),{status:response.status});throw Error('Invalid server response');}
    if(!response.ok)throw Object.assign(Error(data.message||data.error||`Server error ${response.status}`),{status:response.status});return data;
  };
  function decode(round, fallbackBet, fallbackMode) {
    const state=round.state, events=Array.isArray(state)?state:state?.events;
    if(!Array.isArray(events)||!events.length)throw Error('Round has no supported event state');
    const first=events.find(e=>e.type==='roundStart'), end=events.findLast(e=>e.type==='roundEnd');
    const mode=String(round.mode||fallbackMode||first?.mode||'base').toLowerCase();
    const bet=Number.isSafeInteger(round.amount)?round.amount/MONEY_UNIT:fallbackBet;
    if(!Number.isFinite(bet)||bet<=0||!config.modes[mode])throw Error('Invalid round wager or mode');
    const payout=Number.isSafeInteger(round.payout)?round.payout/MONEY_UNIT:Number(round.payoutMultiplier)*bet;
    if(!Number.isFinite(payout)||payout<0)throw Error('Invalid server payout');
    const expected=end?.totalHundredths/100*bet;
    if(!Number.isFinite(expected)||Math.abs(expected-payout)>1/MONEY_UNIT)throw Error('Round events and server payout disagree');
    return {id:round.roundID??round.betID??params.get('event'),version:first?.bookVersion||3,gdd:first?.gdd||'1.7',rules:first?.rules||config.rules,
      mode,bet,cost:bet*(round.costMultiplier??config.modes[mode].cost),payout,events,totalHundredths:end.totalHundredths};
  }
  const balance=()=>auth.balance.amount/MONEY_UNIT;
  async function authenticate(){
    auth=await call('/wallet/authenticate',{sessionID});
    if(!Number.isSafeInteger(auth.balance?.amount)||!auth.balance?.currency)throw Error('Invalid server balance');
    config.allowedBets=allowedAmounts(auth.config).map(n=>n/MONEY_UNIT);config.currency=auth.balance.currency;
    config.defaultBet=(auth.round?.active?auth.round.amount:auth.config.defaultBetLevel)/MONEY_UNIT;
    config.jurisdiction=auth.config.jurisdiction||{};
    if(config.jurisdiction.minimumRoundDuration)throw Error('This game version does not yet support this location’s round timing setting');
    if(Array.isArray(auth.config.gameModes)){
      const enabled=new Set();
      for(const entry of auth.config.gameModes){
        const id=entry.mode?.toLowerCase(),spec=config.modes[id];if(!spec)continue;
        if(entry.costMultiplier!==spec.cost)throw Error('Server modes do not match this release configuration');
        spec.serverMode=entry.mode;enabled.add(id);
      }
      for(const [id,spec] of Object.entries(config.modes))if(!enabled.has(id))spec.disabled=true;
    }
    active=auth.round?.active?auth.round:null;
    return {sessionId:sessionID,balance:balance(),lastRound:active?decode(active,config.defaultBet):null};
  }
  return {replay,params,
    async initialize(localConfig){
      config=localConfig;
      if(!replay)return authenticate();
      for(const k of ['game','version','mode','event'])if(!params.get(k)||!/^[\w-]+$/.test(params.get(k)))throw Error(`Invalid replay ${k}`);
      const data=await call(`/bet/replay/${['game','version','mode','event'].map(k=>encodeURIComponent(params.get(k))).join('/')}`);
      const amount=Number(params.get('amount'));const bet=Number.isSafeInteger(amount)&&amount>0?amount/MONEY_UNIT:1;
      config.currency=params.get('currency')||'USD';
      return {sessionId:null,balance:0,lastRound:decode({...data,mode:params.get('mode')},bet)};
    },
    async play(payload){
      if(replay)throw Error('Betting is disabled during replay');
      if(active){const book=decode(active,config.defaultBet);await this.complete();return {sessionId:sessionID,balance:balance(),round:book,recovered:true};}
      if(storage?.getItem(key)){
        const result=await authenticate();
        if(active)return {...result,round:result.lastRound,recovered:true};
        storage?.removeItem(key);
        return {...result,round:null,recovered:true,message:'Previous request resolved. Balance refreshed; no new play was placed.'};
      }
      const amount=Math.round(payload.bet*MONEY_UNIT),cost=amount*config.modes[payload.mode]?.cost;
      const spec=config.modes[payload.mode];
      if(!spec||spec.disabled)throw Object.assign(Error('Mode unavailable'),{status:400});
      if(!allowedAmounts(auth.config).includes(amount)||!Number.isSafeInteger(cost))throw Object.assign(Error('Invalid play amount'),{status:400});
      if(auth.balance.amount<cost)throw Object.assign(Error('Insufficient balance'),{status:400});
      storage?.setItem(key,JSON.stringify({mode:payload.mode,amount}));
      try {
        const result=await call('/wallet/play',{sessionID,amount,mode:spec.serverMode||payload.mode});
        if(!Number.isSafeInteger(result.balance?.amount))throw Error('Invalid balance response');
        auth.balance=result.balance;active=result.round?.active?result.round:null;
        const book=decode(result.round,payload.bet,payload.mode);
        if(!active)storage?.removeItem(key);
        return {sessionId:sessionID,balance:balance(),round:book};
      }catch(error){if(error.status&&error.status<500&&error.status!==408)storage?.removeItem(key);throw error;}
    },
    async complete(){
      if(replay||!active)return balance();
      if(settlementUncertain){
        await authenticate();settlementUncertain=false;
        if(!active){storage?.removeItem(key);return balance();}
      }
      try{
        const result=await call('/wallet/end-round',{sessionID});
        if(!Number.isSafeInteger(result.balance?.amount))throw Error('Invalid settlement balance');
        auth.balance=result.balance;active=null;storage?.removeItem(key);return balance();
      }catch(error){settlementUncertain=true;throw error;}
    }
  };
}
