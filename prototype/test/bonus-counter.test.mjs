import test from 'node:test';
import assert from 'node:assert/strict';
import {bonusCounterState as next,bonusCounterText as text} from '../public/bonus-counter.mjs';
import {generateScenario} from '../scenarios.mjs';

test('counter follows actual natural entry and retrigger records without counting cascades',()=>{
  for(const id of ['natural','retrigger','intervention']){
    const book=generateScenario(id);let state=null,entered=false,retriggered=false;
    for(const event of book.events){
      const prior=state;state=next(state,event);
      if(event.type==='featureStart'){entered=true;assert.equal(state.remaining,event.spins);}
      if(event.type==='spinStart'&&event.feature)assert.equal(state.remaining,event.remaining);
      if(event.type==='retrigger'){retriggered=true;assert.equal(state.remaining,prior.remaining+5);assert.equal(state.added,5);}
      if(event.type==='cascade')assert.equal(state,prior);
      if(event.type==='roundEnd')assert.equal(text(state).value,'COMPLETE');
    }
    assert.ok(entered);assert.equal(retriggered,id==='retrigger');
  }
});

test('last spin, retrigger from zero, God, cap and new-round reset are distinct',()=>{
  let state=next(null,{type:'featureStart',mode:'lesser',spins:10});
  state=next(state,{type:'spinStart',feature:true,remaining:0});
  assert.equal(text(state).value,'FINAL');
  state=next(state,{type:'retrigger',remaining:5,added:5});
  assert.equal(text(state).value,'5');assert.match(text(state).announcement,/5 extra/);
  state=next(state,{type:'winCap'});state=next(state,{type:'spinEnd',remaining:0});state=next(state,{type:'roundEnd'});
  assert.equal(text(state).value,'REACHED');
  assert.equal(next(state,{type:'roundStart'}),null);
  state=next(null,{type:'featureStart',mode:'god',spins:1});
  state=next(state,{type:'spinStart',feature:true,remaining:0});
  assert.equal(text(state).label,'RITUAL SPIN');assert.equal(text(state).value,'1');assert.equal(text(state).unit,'IN PLAY');
  assert.equal(next(null,{type:'spinStart',feature:false,remaining:0}),null);
});
