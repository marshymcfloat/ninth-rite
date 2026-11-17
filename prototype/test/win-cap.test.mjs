import test from 'node:test';
import assert from 'node:assert/strict';
import { allocateCap, resolveCascade, cell, generateRound } from '../engine.mjs';
import { catalogBook } from '../math/catalog-generator.mjs';

test('cap allocation uses largest remainders with stable ties and integer precision',()=>{
  assert.deepEqual(allocateCap([10,10,10],2),[1,1,0]);
  assert.deepEqual(allocateCap([100,200,300],100),[17,33,50]);
  assert.deepEqual(allocateCap([10,20],100),[10,20]);
  assert.deepEqual(allocateCap([10,20],0),[0,0]);
  assert.deepEqual(allocateCap([0,0],0),[0,0]);
  assert.throws(()=>allocateCap([1],-.1));
});

test('terminal capped cascade does not collect charges or spend Offerings',()=>{
  const board=Array.from({length:5},()=>['C1','C2','C3','C4','P1','P2'].map(s=>cell(s,true)));
  const before={tier:16,blood:4,offerings:6};
  const win=resolveCascade(board,before,{feature:true,remainingPayoutHundredths:1,selectPromotion:()=>{throw Error('Must not invoke after cap');}});
  assert.equal(win.capReached,true);assert.equal(win.payoutHundredths,1);
  assert.equal(win.clusters.reduce((s,c)=>s+c.payoutHundredths,0),1);
  assert.equal(win.after.tier,16);assert.equal(win.after.blood,4);assert.equal(win.after.offerings,6);
  assert.equal(win.bloodCollected,0);assert.equal(win.offeringsCollected,0);
  assert.ok(win.uncappedPayoutHundredths>1);
});

test('every mode has a legal capped sample ending without additional spins or unresolved offers',()=>{
  for(const mode of ['base','ante_15','ante_30','lesser','blood','greater','god']){
    const book=catalogBook(mode,0);assert.equal(book.totalHundredths,5000000);assert.equal(book.capReached,true);
    assert.equal(book.finalState.pendingTier,undefined);
    const index=book.events.findIndex(e=>e.type==='winCap');
    assert.deepEqual(book.events.slice(index+1).map(e=>e.type),['spinEnd','roundEnd']);
    assert.equal(book.events.filter(e=>e.type==='cascade').reduce((s,e)=>s+e.payoutHundredths,0),5000000);
    assert.deepEqual(catalogBook(mode,0),book);
  }
});

test('zero outcomes and ordinary seeded books are not fabricated to satisfy cap coverage',()=>{
  for(let i=1;i<100;i++)assert.deepEqual(catalogBook('god',i),generateRound({mode:'god',seed:`ninth-v1.7:god:${i}`}));
});
