import {frameSvg} from './frame-layout.mjs';
import {createMascot} from './mascot.mjs';
import {createLocalSession} from '../local-session.mjs';
import {playRecordedBook} from './playback.mjs';
import {createPresentation,SYMBOL_NAMES} from './game-view.mjs';
import {formatMoney as format} from '../money.mjs';
import {applyArt,artBox,getArt} from './art.mjs';
import {createSlotControls} from '../slot-controls.mjs';
import {createSlotAudio} from '../slot-audio.mjs';
const $=id=>document.getElementById(id),frame=document.querySelector('.reel-frame');
function resizeFrame(){const {width,height}=frame.getBoundingClientRect(),scale=parseFloat(getComputedStyle(frame).fontSize);if(width&&height&&scale)frame.innerHTML=frameSvg(width,height,scale);}
new ResizeObserver(resizeFrame).observe(frame);resizeFrame();
function fitSceneArt(){document.querySelectorAll('.brand-ornament img,.altar-rail>img,.help-illustration img').forEach(img=>applyArt(img,img.dataset.art));}
function layoutAltar(){
  const rail=document.querySelector('.altar-rail'),{width,height}=rail.getBoundingClientRect(),asset=getArt('altar-surround');
  if(!width||!height||!asset.labelArea)return;
  const box=artBox('altar-surround',width,height),[x,y,w,h]=asset.labelArea;
  const top=box.top+y*box.scale,heightOfLabels=h*box.scale;
  rail.style.setProperty('--altar-label-left',`${box.left+x*box.scale}px`);
  rail.style.setProperty('--altar-label-top',`${top}px`);
  rail.style.setProperty('--altar-label-width',`${w*box.scale}px`);
  rail.style.setProperty('--altar-label-height',`${heightOfLabels}px`);
  rail.style.setProperty('--altar-track-top',`${top+heightOfLabels*.9}px`);
}
new ResizeObserver(layoutAltar).observe(document.querySelector('.altar-rail'));fitSceneArt();layoutAltar();
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mascot=createMascot($('mascot'),{reduced}),game=createLocalSession({rulesVersion:'rite-v1.9'});
let config,session,view,lastBook,busy=true,paused=reduced.matches,speed=1,bet=1,baseMode='base',confirmation=null,skipQueued=false;
const message=text=>{$('sceneMessage').textContent=text;};
function setNotice(text=''){
  const notice=$('sceneNotice');
  notice.hidden=!text;
  notice.textContent=text;
}
const modeArt={lesser:'rite-lesser',blood:'rite-blood',greater:'rite-greater',god:'rite-god',base:'symbol-chalice',ante_15:'symbol-scatter',ante_30:'symbol-reliquary'};
const riteDialog=$('riteDialog'),selector=riteDialog.querySelector('.rite-selector');
let selectorClosing=false,selectorExit=null,selectorTimer=null;
function clearSelectorMotion(){
  const targets=[selector,...riteDialog.querySelectorAll('.rite-card')];
  globalThis.gsap?.killTweensOf(targets);
  globalThis.gsap?.set(targets,{clearProps:'opacity,transform,visibility'});
  delete riteDialog.dataset.transition;
}
function openSelector(){
  if(riteDialog.open||selectorClosing)return;
  buildRites();clearSelectorMotion();riteDialog.showModal();riteDialog.scrollTop=0;
  if(reduced.matches||paused||!globalThis.gsap)return;
  riteDialog.dataset.transition='enter';
  globalThis.gsap.fromTo(selector,{opacity:0,y:12},{opacity:1,y:0,duration:.3,ease:'power2.out',clearProps:'opacity,transform'});
  globalThis.gsap.fromTo(riteDialog.querySelectorAll('.rite-card'),{opacity:0,y:20,scale:.975},{opacity:1,y:0,scale:1,duration:.32,stagger:.035,ease:'power2.out',clearProps:'opacity,transform'});
}
function closeSelector(afterClose){
  if(selectorClosing)return;
  if(!riteDialog.open){afterClose?.();return;}
  selectorClosing=true;
  selectorExit=()=>{
    const callback=afterClose;selectorExit=null;clearTimeout(selectorTimer);selectorTimer=null;
    clearSelectorMotion();selectorClosing=false;riteDialog.close();callback?.();
  };
  if(reduced.matches||paused||!globalThis.gsap){selectorExit();return;}
  riteDialog.dataset.transition='exit';
  globalThis.gsap.killTweensOf(selector);
  globalThis.gsap.to(selector,{opacity:0,y:8,duration:.2,ease:'power1.in',onComplete:()=>selectorExit?.()});
  selectorTimer=setTimeout(()=>selectorExit?.(),300);
}
riteDialog.addEventListener('cancel',event=>{event.preventDefault();closeSelector();});
riteDialog.addEventListener('close',()=>{if(!riteDialog.open){selectorExit?.();clearSelectorMotion();}});
reduced.addEventListener('change',event=>{if(event.matches){selectorExit?.();clearSelectorMotion();}});
function selectorReadout(){
  $('selectorBalance').textContent=session?format(session.balance):'—';$('selectorBet').textContent=format(bet);
  const blocked=busy||!!game.pending()||!!confirmation,index=config?.allowedBets.indexOf(bet)??0;
  for(const id of ['selectorBetDown','betDown'])$(id).disabled=blocked||index<=0;
  for(const id of ['selectorBetUp','betUp'])$(id).disabled=blocked||index>=(config?.allowedBets.length??1)-1;
}
const audio=createSlotAudio(document,{musicSrc:'/style-2/media/engraved-v1/cathedral-music.mp3'});
const controls=createSlotControls($('gameControls'),{
  storageKey:'ninth-style2-controls',reduced,
  onSpeed(value){speed=value;view?.setSpeed(value);mascot.setSpeed?.(value);},
  onSound:audio.setSound,onMusic:audio.setMusic,
  onMotion(enabled){
    paused=!enabled;
    mascot.setPaused(paused);
    document.querySelector('.scene').classList.toggle('motion-paused',paused);
  },
});
function setBusy(value){
  busy=value;const unresolved=game.pending();
  for(const id of ['bonusButton','betUp','betDown'])$(id).disabled=value||!!unresolved;
  const spin=$('previewSpin');
  spin.disabled=value||!session;
  spin.dataset.state=value?'busy':unresolved?'retry':'ready';
  spin.querySelector('[data-slot-spin-label]').textContent=value?'WAIT':unresolved?'RETRY':'SPIN';
  spin.setAttribute('aria-label',value?'Spin in progress':unresolved?'Recover unresolved round':'Spin');
  $('skipPlayback').hidden=!value||!session;$('replayRound').disabled=value||!lastBook;
  $('confirmPurchase').disabled=value||!!(confirmation?.feature&&confirmation.cost>session?.balance);$('balance').textContent=session?format(session.balance):'—';
  selectorReadout();
}
function modeReadout(){
  $('wagerLabel').textContent=baseMode==='base'?'BASE BET':'SPIN COST';
  $('wagerValue').textContent=format(bet*config.modes[baseMode].cost);
  localStorage.setItem('ninth-style2-base',baseMode);localStorage.setItem('ninth-style2-bet',String(bet));
  selectorReadout();
}
function tableRow(values, headings=false){
  const row=document.createElement('tr');
  values.forEach((value,index)=>{
    const cell=document.createElement(headings||index===0?'th':'td');
    if(headings||index===0)cell.scope=headings?'col':'row';
    cell.textContent=value;
    row.append(cell);
  });
  return row;
}
function updateMathHelp(){
  if(!config)return;
  const formatPercent=fraction=>`${(fraction*100).toFixed(2)}%`;
  const modes=Object.entries(config.modes).filter(([,spec])=>!spec.disabled);
  $('rulePriceBasis').textContent=`Play credits at a ${format(bet)} base bet`;
  $('rulePriceRows').replaceChildren(...modes.map(([id,spec])=>{
    const stats=config.catalog?.[id];
    return tableRow([
      spec.name,
      `${format(bet*spec.cost)} (${spec.cost}×)`,
      stats?formatPercent(stats.rtp):'—',
      format(bet*(stats?.maxWin??config.rules.maxWin)),
    ]);
  }));
  const chances=modes.filter(([id,spec])=>!spec.feature&&Number.isFinite(config.catalog?.[id]?.naturalRate));
  $('ruleChance').textContent=chances.length
    ? `Chance of a bonus on a paid spin. ${chances.map(([id,spec])=>`${spec.name} ${formatPercent(config.catalog[id].naturalRate)}`).join(' · ')}`
    : '';
  $('ruleChance').hidden=!chances.length;
  $('ruleRtpBasis').textContent=config.catalog
    ? 'RTP is the average return as a share of the full cost over many rounds.'
    : 'This development preview uses uncalibrated outcomes.';
  const {bands,payHundredths}=config.testMath;
  $('rulePaytableHead').replaceChildren(tableRow(['Symbol',...bands.map(({min},index)=>{
    const next=bands[index+1];
    return next?`${min}–${next.min-1}`:`${min}+`;
  })],true));
  $('rulePaytableRows').replaceChildren(...payHundredths.map((pay,index)=>
    tableRow([Object.values(SYMBOL_NAMES)[index],...bands.map(({factor})=>`${format(pay*factor/100)}×`)])
  ));
}
async function requestPlay(selection={mode:baseMode,bet}){
  if(busy||!session)return;
  const unitCost=selection.unitCost??config.modes[selection.mode].cost;
  const wager=Object.freeze({...selection,unitCost,price:selection.price??selection.bet*unitCost});skipQueued=false;setNotice();setBusy(true);
  try{
    controls.closeSettings();
    controls.spinFeedback();
    view?.flashSpin($('previewSpin'));
    audio.play('spin');
    await game.run(async()=>{
      const result=await game.play(wager);session=result;lastBook=result.round||result.lastRound;
      if(result.round)await playRecordedBook(result.round,config,view,{instant:skipQueued});
    });
  }catch(error){setNotice(`${error.message}${game.pending()?' Press Retry to recover the same round.':''}`);}
  finally{setBusy(false);modeReadout();}
}
function choose(mode){
  if(busy||game.pending()||selectorClosing)return;
  const spec=config.modes[mode];if(!spec||spec.disabled)return;
  if(!spec.feature&&spec.cost<=2){baseMode=mode;modeReadout();closeSelector();message(`${spec.name} activated`);return;}
  confirmation=Object.freeze({mode,bet,unitCost:spec.cost,price:bet*spec.cost,cost:bet*spec.cost,feature:spec.feature});
  $('confirmTitle').textContent=spec.name;$('confirmCost').textContent=`${format(confirmation.cost)} play credits`;
  applyArt($('confirmArt'),modeArt[mode],{occupancy:.96});$('confirmDialog').dataset.rite=mode;
  $('confirmDetail').textContent=spec.feature?`${spec.spins} ${mode==='god'?'ritual spin with a guaranteed pre-spin multiplier. A win is not guaranteed.':`free spins, starting at ×${spec.tier}.`}`:`Each spin costs ${format(confirmation.cost)} play credits.`;
  $('confirmPurchase').textContent=spec.feature?'Confirm and begin':'Activate Maximum Chance';
  $('confirmPurchase').disabled=spec.feature&&confirmation.cost>session.balance;
  $('confirmBalance').textContent=spec.feature&&confirmation.cost>session.balance?'Insufficient play credits.':`Balance ${format(session.balance)} · Base bet ${format(bet)}`;
  $('confirmDialog').showModal();
  selectorReadout();
}
function buildRites(){
  for(const target of ['riteOptions','baseOptions'])$(target).replaceChildren();
  for(const [id,spec] of Object.entries(config.modes)){
    if(spec.disabled)continue;
    const card=document.createElement('article');card.className='rite-card';card.dataset.rite=id;
    const art=document.createElement('div');art.className='card-art';art.setAttribute('aria-hidden','true');
    const hero=document.createElement('div');hero.className='card-art-object card-art-hero';
    const img=document.createElement('img');img.alt='';img.draggable=false;hero.append(img);art.append(hero);applyArt(img,modeArt[id],{occupancy:.98});
    if(!spec.feature){
      for(const [i,symbol] of (id==='base'?['j','q']:id==='ante_15'?['eye','chalice']:['crown','scatter']).entries()){
        const sideBox=document.createElement('div');sideBox.className=`card-art-object art-side art-side-${i}`;
        const side=document.createElement('img');side.alt='';side.draggable=false;sideBox.append(side);art.append(sideBox);applyArt(side,`symbol-${symbol}`,{occupancy:.93});
      }
    }
    const body=document.createElement('div');body.className='card-body';
    const label=document.createElement('span');label.className='card-kicker';label.textContent=spec.feature?`${spec.spins} ${id==='god'?'RITUAL SPIN':'FREE SPINS'}`:id==='base'?'BASE GAME':'BONUS CHANCE';
    const name=document.createElement('h3');name.textContent=spec.name;
    const detail=document.createElement('p');detail.className='card-detail';detail.textContent=spec.feature?(id==='god'?'×250–×2500 altar':`Start at ×${spec.tier}`):id==='base'?'Standard bonus odds':id==='ante_15'?'Increased bonus chance':'Highest bonus chance';
    const cost=document.createElement('strong');cost.className='card-price';cost.textContent=format(spec.cost*bet);
    const units=document.createElement('small');units.className='card-units';units.textContent=`play credits · ${spec.cost}× base bet`;
    const button=document.createElement('button');button.className='card-action';button.dataset.mode=id;button.textContent=spec.feature?'BUY':baseMode===id?'ACTIVE':'ACTIVATE';
    button.setAttribute('aria-label',`${spec.feature?'Buy':'Activate'} ${spec.name}, ${format(spec.cost*bet)} play credits${spec.feature?'':' per spin'}`);
    if(!spec.feature)button.setAttribute('aria-pressed',String(baseMode===id));
    button.addEventListener('click',()=>choose(id));body.append(label,name,detail,cost,units,button);card.append(art,body);
    $(spec.feature?'riteOptions':'baseOptions').append(card);
  }
  selectorReadout();
}
$('confirmPurchase').addEventListener('click',()=>{
  if(!confirmation||busy||$('confirmPurchase').disabled)return;
  const selection=confirmation;confirmation=null;$('confirmDialog').close();
  closeSelector(()=>{if(selection.feature)requestPlay(selection);else{baseMode=selection.mode;modeReadout();message('Maximum Chance activated');}});
});
$('confirmDialog').addEventListener('close',()=>{confirmation=null;selectorReadout();});
$('previewSpin').addEventListener('click',()=>requestPlay());
$('bonusButton').addEventListener('click',()=>{if(!busy&&!game.pending()){controls.closeSettings();audio.play('tap');openSelector();}});
$('helpButton').addEventListener('click',()=>{controls.closeSettings();audio.play('tap');updateMathHelp();$('helpDialog').showModal();fitSceneArt();});
document.querySelectorAll('.close-dialog').forEach(button=>button.addEventListener('click',()=>{const dialog=button.closest('dialog');if(dialog===riteDialog)closeSelector();else dialog.close();}));
for(const [id,direction] of [['betUp',1],['betDown',-1],['selectorBetUp',1],['selectorBetDown',-1]])$(id).addEventListener('click',()=>{
  if(busy||game.pending()||confirmation||selectorClosing)return;
  const i=Math.max(0,Math.min(config.allowedBets.length-1,config.allowedBets.indexOf(bet)+direction));bet=config.allowedBets[i];modeReadout();
  audio.play('tap');
  if($('riteDialog').open)buildRites();
});
function skipPlayback(){skipQueued=true;view?.skip();}
$('skipPlayback').addEventListener('click',skipPlayback);
$('replayRound').addEventListener('click',async()=>{
  if(busy||!lastBook)return;$('helpDialog').close();setNotice();setBusy(true);
  try{await playRecordedBook(lastBook,config,view,{replay:true});}catch(error){setNotice(error.message);}finally{setBusy(false);}
});
document.addEventListener('keydown',event=>{
  if(event.code!=='Space'||event.repeat||controls.settingsOpen||document.querySelector('dialog[open]')||['BUTTON','INPUT','SELECT','TEXTAREA','A'].includes(event.target.tagName))return;
  event.preventDefault();if(busy)skipPlayback();else requestPlay();
});
window.addEventListener('storage',event=>{if(event.key==='ninth-pending'&&!busy)setBusy(false);});
window.addEventListener('focus',async()=>{
  if(busy||!session)return;
  try{session=await game.run(()=>game.init());setBusy(false);}catch{/* The active tab retains ownership. */}
});
async function init(){
  if(new URLSearchParams(location.search).has('sessionID')){
    setNotice('This page supports play credits only. Open the game without a wallet session.');
    return;
  }
  try{
    const manifestRequest=fetch('/style-2/manifest.json').then(r=>r.ok?r.json():{}).catch(()=>({}));
    config=await game.api('/api/config?rulesVersion=rite-v1.9');
    const manifest=await manifestRequest;mascot.configure(manifest);
    const saved=localStorage.getItem('ninth-style2-base');if(config.modes[saved]&&!config.modes[saved].feature&&!config.modes[saved].disabled)baseMode=saved;
    const savedBet=Number(localStorage.getItem('ninth-style2-bet'));if(config.allowedBets.includes(savedBet))bet=savedBet;
    modeReadout();view=createPresentation({document,gsap:globalThis.gsap,config,mascot,options:()=>({speed,reduced:paused}),format,manifest,sound:audio.play});
    await view.board(config.initialBoard,null,{still:true});
    view.readouts({rules:config.rules,state:{tier:1,blood:0,offerings:0},counter:null,feature:false,payout:0});
    $('ruleBlood').textContent=config.rules.bloodThreshold;$('ruleOfferings').textContent=config.rules.offeringThreshold;
    $('ruleModes').textContent=['lesser','blood','greater'].map(id=>{const m=config.modes[id];return `${m.name}: ${m.spins} free spins at ×${m.tier}, purchase ${m.cost}× base bet`;}).join('. ')+`. God Mode: ${config.modes.god.cost}× base bet, one spin at a guaranteed tier; a win is not guaranteed.`;
    session=await game.run(()=>game.init());lastBook=session.lastRound;
    const reviewName=new URLSearchParams(location.search).get('review');
    if(game.pending()){setBusy(false);await requestPlay();}
    else if(reviewName&&Object.hasOwn(config.scenarios,reviewName)){
      if(!reduced.matches&&!document.hidden)mascot.prepare('invocation');
      const result=await game.api('/api/scenario',{sessionId:session.sessionId,rulesVersion:config.rulesVersion,scenario:reviewName});
      const {reviewPresentation}=await import('./review.mjs');lastBook=result.round;setBusy(true);
      await playRecordedBook(lastBook,config,reviewPresentation(view,document),{replay:true});setBusy(false);
    }
    else{if(lastBook)await playRecordedBook(lastBook,config,view,{instant:true,replay:true});else message('Ready');setBusy(false);}
    // Optional character downloads start only after session recovery has finished.
    if(!reduced.matches&&!document.hidden)for(const name of ['invocation','bonus','benediction','expiry'])mascot.prepare(name);
  }catch(error){setNotice(`Could not load the game. ${error.message} Reload to retry.`);}
}
init();
window.addEventListener('pagehide',event=>{if(event.persisted){view?.skip();mascot.cancel({resumeIdle:false});controls.closeSettings();}else{controls.destroy();audio.destroy();view?.destroy?.();mascot.destroy();}});
window.addEventListener('pageshow',event=>{if(event.persisted)mascot.setPaused(paused);});
