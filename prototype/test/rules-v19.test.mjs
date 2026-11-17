import test from 'node:test';
import assert from 'node:assert/strict';
import {generateRound} from '../engine-v19.mjs';
import {MODES,RULES} from '../rules-v19.mjs';
import {cell} from '../engine.mjs';
import {quietBoard,oneCluster,withCells} from '../scenarios.mjs';
import {validateBook} from '../math/validate-v19-book.mjs';
import {initialPlayback,applyRecordedEvent} from '../public/style-2/playback.mjs';
const options={mode:'lesser',initialState:{tier:16,blood:0,offerings:5},selectPromotion:()=>64,refillSource:({row,col})=>quietBoard()[row][col]};
const validate=book=>{validateBook(book);return book;};

test('v1.9 purchased and natural tiers and fixed prices',()=>{
  for(const [mode,tier,cost] of [['lesser',16,100],['blood',32,200],['greater',64,500]]){
    assert.equal(MODES[mode].cost,cost);
    const book=validate(generateRound({mode,boardSource:quietBoard}));assert.equal(book.events[0].state.tier,tier);
    const count={lesser:3,blood:4,greater:5}[mode];
    const natural=validate(generateRound({boardSource:({feature})=>feature?quietBoard():withCells(quietBoard(),[0,5,12,17,24].slice(0,count),'S')}));
    assert.equal(natural.events.find(e=>e.type==='featureStart').state.tier,tier);
  }
  assert.equal(MODES.god.cost,1000);
});
test('first-chance confirmation pays the triggering win at old tier and next win at offered tier',()=>{
  const full=()=>Array.from({length:5},()=>['C1','C2','C3','C4','P1','P2'].map(s=>cell(s)));
  const book=validate(generateRound({...options,selectPromotion:()=>120,boardSource:({spin})=>spin===1?full():quietBoard(),refillSource:({cascade,row,col})=>cascade===1?full()[row][col]:quietBoard()[row][col]}));
  const confirmation=book.events.find(e=>e.type==='interventionConfirmed');assert.equal(confirmation.chance,1);
  const wins=book.events.filter(e=>e.type==='cascade');assert.equal(wins[0].payoutMultiplier,16);assert.equal(wins[1].payoutMultiplier,120);
});
test('deferred offer confirms before next-spin payout, keeping banked Offerings and Blood',()=>{
  const book=validate(generateRound({...options,boardSource:({spin})=>spin<=2?oneCluster():quietBoard()}));
  const deferred=book.events.find(e=>e.type==='interventionDeferred');
  assert.equal(deferred.state.tier,16);assert.equal(deferred.state.pendingTier,64);assert.equal(deferred.state.pendingExpirySpin,2);assert.equal(deferred.state.offerings,2);
  const confirmation=book.events.find(e=>e.type==='interventionConfirmed');assert.equal(confirmation.chance,2);assert.equal(confirmation.spin,2);
  assert.equal(book.events.find(e=>e.type==='cascade'&&e.spin===2).payoutMultiplier,64);
  let model=initialPlayback({...book,bet:1,payout:book.totalHundredths/100},{rules:RULES});
  for(const event of book.events){model=applyRecordedEvent(model,event,{...book,bet:1,payout:book.totalHundredths/100});if(event.type==='spinStart'&&event.spin===2){assert.equal(model.pending,64);assert.equal(model.state.tier,16);}}
});
test('a losing second chance expires even when Scatters add more spins',()=>{
  const book=validate(generateRound({...options,boardSource:({spin})=>spin===1?oneCluster():spin===2?withCells(quietBoard(),[0,5,12],'S'):spin===3?oneCluster():quietBoard()}));
  const expiry=book.events.find(e=>e.type==='interventionExpired');assert.equal(expiry.spin,2);assert.equal(expiry.reason,'second-chance-lost');
  assert.equal(expiry.state.tier,16);assert.equal(expiry.state.offerings,2);assert.equal(book.spins,15);
  assert.equal(book.events.find(e=>e.type==='cascade'&&e.spin===3).payoutMultiplier,16);
});
test('last-spin invocation expires without phantom spins; confirming win can invoke a fresh offer',()=>{
  const last=validate(generateRound({...options,boardSource:({spin})=>spin===10?oneCluster():quietBoard()}));
  assert.equal(last.spins,10);assert.equal(last.events.filter(e=>e.type==='interventionDeferred').length,0);assert.equal(last.events.find(e=>e.type==='interventionExpired').reason,'no-next-spin');
  const chained=validate(generateRound({...options,initialState:{tier:16,blood:0,offerings:6},selectPromotion:(tier,allowed)=>allowed[0],boardSource:({spin})=>spin<=2?oneCluster():quietBoard()}));
  const confirmIndex=chained.events.findIndex(e=>e.type==='interventionConfirmed');
  assert.equal(chained.events[confirmIndex+1].type,'cascade');assert.equal(chained.events[confirmIndex+2].type,'interventionPending');assert.equal(chained.interventionCount,2);
});
test('God has one spin and maximum wins stop all remaining opportunities',()=>{
  const god=validate(generateRound({mode:'god',godTier:250,boardSource:quietBoard}));assert.equal(god.spins,1);assert.equal(god.totalHundredths,0);
  const cap=validate(generateRound({mode:'greater',boardSource:()=>Array.from({length:5},()=>Array.from({length:6},()=>cell('P4'))),refillSource:()=>cell('P4')}));assert.equal(cap.totalHundredths,5000000);assert.equal(cap.finalState.pendingTier,undefined);
});
test('independent validator rejects wrong payout, second-chance deadline and spin accounting',()=>{
  const book=generateRound({...options,boardSource:({spin})=>spin<=2?oneCluster():quietBoard()});
  for(const mutate of [b=>b.events.find(e=>e.type==='cascade').payoutHundredths++,b=>b.events.find(e=>e.type==='interventionDeferred').state.pendingExpirySpin++,b=>b.events.find(e=>e.type==='spinEnd').remaining++]){
    const corrupt=structuredClone(book);mutate(corrupt);assert.throws(()=>validateBook(corrupt));
  }
});
test('a deferred maximum-tier offer seals only on confirmation; expiry keeps earned Blood and surplus Offerings',()=>{
  for(const winsNext of [false,true]){
    const book=validate(generateRound({...options,selectPromotion:()=>2500,initialState:{tier:16,blood:2,offerings:5},boardSource:({spin})=>spin===1||(spin===2&&winsNext)?oneCluster():quietBoard()}));
    const deferred=book.events.find(e=>e.type==='interventionDeferred');assert.equal(deferred.state.tier,16);assert.equal(deferred.state.sealed,false);assert.equal(deferred.state.blood,3);assert.equal(deferred.state.offerings,2);
    const resolution=book.events.find(e=>e.type===(winsNext?'interventionConfirmed':'interventionExpired'));
    assert.equal(resolution.state.tier,winsNext?2500:16);assert.equal(resolution.state.sealed,winsNext);assert.equal(resolution.state.blood,winsNext?0:3);assert.equal(resolution.state.offerings,winsNext?0:2);
    if(winsNext)assert.equal(book.events.find(e=>e.type==='cascade'&&e.spin===2).payoutMultiplier,2500);
  }
});
