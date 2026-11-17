import test from 'node:test';
import assert from 'node:assert/strict';
import {allowedAmounts,createStakeClient,rgsOrigin} from '../public/stake-client.mjs';
const limits={minBet:100000,maxBet:2000000,stepBet:100000,defaultBetLevel:1000000,betLevels:[100000,500000,1000000,2000000]};
const cfg=()=>({rules:{bloodThreshold:5},modes:{base:{cost:1},lesser:{cost:100}}});
const round=(payout=2000000,extra={})=>({roundID:7,mode:'base',amount:1000000,payout,active:payout>0,state:[{type:'roundStart',mode:'base'},{type:'roundEnd',totalHundredths:payout/10000}],...extra});
function mock(responses,search='?rgs_url=rgs.example.test&sessionID=test'){
  const calls=[],memory=new Map();
  const client=createStakeClient({search,storage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},fetcher:async(url,opt)=>{
    calls.push({url,...opt,body:opt.body&&JSON.parse(opt.body)});
    const next=responses.shift();if(next instanceof Error)throw next;
    assert.ok(next,'Unexpected server request');return {ok:!next.status,status:next.status||200,text:async()=>JSON.stringify(next)};
  }});return {client,calls,memory};
}
const auth=(extra={})=>({balance:{amount:1000000000,currency:'USD'},config:structuredClone(limits),...extra});
test('server bet levels are authoritative; six-decimal amounts and connection validation',()=>{
  assert.equal(createStakeClient({search:''}),null);
  for(const bad of ['https://rgs.test','rgs.test/path','user@rgs.test',''])assert.throws(()=>rgsOrigin(bad));
  assert.deepEqual(allowedAmounts({...limits,betLevels:[1000000,1200000]}),[1000000,1200000]);
  assert.throws(()=>allowedAmounts({...limits,betLevels:[1000000,1250000]}));
  assert.deepEqual(allowedAmounts({minBet:150000,maxBet:400000,stepBet:100000,defaultBetLevel:200000}),[200000,300000,400000]);
  assert.throws(()=>allowedAmounts({...limits,betLevels:[-1]}));
});
test('winning play debits once and closes only after playback',async()=>{
  const {client,calls,memory}=mock([auth(),{balance:{amount:999000000,currency:'USD'},round:round()},{balance:{amount:1001000000,currency:'USD'}}]);
  await client.initialize(cfg());const result=await client.play({mode:'base',bet:1});
  assert.equal(result.round.payout,2);assert.equal(calls.length,2);assert.equal(memory.size,1);
  assert.deepEqual(calls[1].body,{sessionID:'test',amount:1000000,mode:'base'});
  assert.equal(await client.complete(),1001);assert.equal(memory.size,0);await client.complete();assert.equal(calls.length,3);
});
test('zero result closes automatically, with no end-round request',async()=>{
  const {client,calls}=mock([auth(),{balance:{amount:999000000,currency:'USD'},round:round(0)}]);
  await client.initialize(cfg());await client.play({mode:'base',bet:1});await client.complete();assert.equal(calls.length,2);
});

test('unsupported nonzero jurisdiction timing prevents a purchase',async()=>{
  const data=auth();data.config.jurisdiction={minimumRoundDuration:2500};
  const {client,calls}=mock([data]);await assert.rejects(client.initialize(cfg()),/round timing/);
  assert.equal(calls.length,1);
});
test('server mode casing and disabled modes are enforced with the shared authenticated bet limits',async()=>{
  const configuration=auth();configuration.config.gameModes=[{mode:'BASE',costMultiplier:1,maxBet:500000}];
  const {client,calls}=mock([configuration,{balance:{amount:999000000,currency:'USD'},round:round(0)}]);
  await client.initialize(cfg());await assert.rejects(client.play({mode:'lesser',bet:.1}),/unavailable/);
  await assert.rejects(client.play({mode:'base',bet:2.5}),/invalid play/i);await client.play({mode:'base',bet:1});
  assert.equal(calls[1].body.mode,'BASE');
  assert.equal(calls[1].body.amount,1000000);
});
test('uncertain play recovers original wager without duplicate purchase',async()=>{
  const original=round(1000000,{amount:500000});original.state[1].totalHundredths=200;
  const {client,calls,memory}=mock([auth(),new Error('network lost'),auth({round:original}),{balance:{amount:1000500000,currency:'USD'}}]);
  await client.initialize(cfg());await assert.rejects(client.play({mode:'base',bet:.5}),/network/);
  assert.equal(memory.size,1);const result=await client.play({mode:'lesser',bet:2});
  assert.equal(result.round.bet,.5);assert.equal(result.recovered,true);await client.complete();
  assert.equal(calls.filter(x=>x.url.endsWith('/wallet/play')).length,1);
});
test('uncertain request with no active round refreshes balance and does not retry purchase',async()=>{
  const {client,calls}=mock([auth(),new Error('lost'),auth()]);await client.initialize(cfg());
  await assert.rejects(client.play({mode:'base',bet:1}));const result=await client.play({mode:'base',bet:1});
  assert.equal(result.round,null);assert.equal(calls.length,3);
});

test('uncertain settlement authenticates before retrying and never repeats a settled award',async()=>{
  const final=auth({balance:{amount:1001000000,currency:'USD'}});
  const {client,calls,memory}=mock([auth(),{balance:{amount:999000000,currency:'USD'},round:round()},new Error('settlement response lost'),final]);
  await client.initialize(cfg());await client.play({mode:'base',bet:1});
  await assert.rejects(client.complete(),/lost/);assert.equal(await client.complete(),1001);
  assert.equal(calls.filter(x=>x.url.endsWith('/end-round')).length,1);assert.equal(memory.size,0);
});
test('refresh recovery uses server amount; malformed payout is rejected',async()=>{
  const {client}=mock([auth({round:round(2000000,{amount:500000})})]);
  await assert.rejects(client.initialize(cfg()),/disagree/);
  const valid=round(2000000,{amount:500000});valid.state[1].totalHundredths=400;
  const restored=mock([auth({round:valid})]);const configuration=cfg();const result=await restored.client.initialize(configuration);
  assert.equal(result.lastRound.bet,.5);assert.equal(configuration.defaultBet,.5);
});
test('public replay is unauthenticated, uses recorded result, and forbids purchases',async()=>{
  const data={state:round().state,payoutMultiplier:2,costMultiplier:100};
  const {client,calls}=mock([data],'?replay=true&rgs_url=rgs.test&game=ninth&version=1&mode=lesser&event=12&amount=1234567&currency=SC');
  const configuration=cfg();const result=await client.initialize(configuration);
  assert.equal(result.lastRound.payout,2.469134);assert.equal(result.lastRound.cost,123.4567);assert.equal(configuration.currency,'SC');
  assert.equal(calls[0].method,'GET');assert.equal(calls[0].body,undefined);await assert.rejects(client.play({}),/disabled/);assert.equal(calls.length,1);
});
