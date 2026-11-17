import assert from 'node:assert/strict';
import { resolveCascade, settleIntervention, snapshot, validateBoard } from '../engine.mjs';
import { TEST_MATH, RULES } from '../config.mjs';
import { planTumble } from '../public/view-math.mjs';

export function validateBook(book, math=TEST_MATH) {
  let state,board,previous,clear,feature=false,total=0,pending=0,confirmed=0,expired=0,capped=false;
  assert.equal(book.version,3);assert.equal(book.gdd,'1.7');assert.equal(book.aborted,false);
  for(const [index,e] of book.events.entries()){
    assert.equal(e.index,index);
    if(capped)assert.ok(['spinEnd','roundEnd'].includes(e.type),'Events after cap');
    if(e.type==='roundStart'){state=e.state;assert.deepEqual(e.rules,RULES);}
    if(e.type==='godIntervention'){assert.ok(math.godTiers.includes(e.tier));state=e.state;}
    if(e.type==='naturalBonus')state=e.state;
    if(e.type==='featureStart'){feature=true;assert.deepEqual(e.state,state);}
    if(e.type==='spinStart'){assert.equal(e.state.pendingTier,undefined);assert.deepEqual(e.state,state);previous=null;clear=null;}
    if(e.type==='board'){
      validateBoard(e.board);
      if(!feature)assert.ok(e.board.flat().every(c=>!c.marked));
      if(!e.initial&&previous&&clear)planTumble(previous,e.board,clear);
      board=e.board;
    }
    if(['interventionConfirmed','interventionExpired'].includes(e.type)){
      const expected=settleIntervention(board,state);assert.ok(expected);assert.equal(expected.type,e.type);assert.equal(expected.tier,e.tier);assert.deepEqual(expected.state,e.state);
      state=e.state;if(e.type==='interventionConfirmed')confirmed++;else expired++;
    }
    if(e.type==='cascade'){
      const expected=resolveCascade(board,state,{feature,math,remainingPayoutHundredths:RULES.maxWin*100-total,selectPromotion:()=>e.promotedTier});
      assert.ok(expected);
      for(const key of Object.keys(expected))assert.deepEqual(e[key],expected[key],`cascade ${index} ${key}`);
      total+=e.payoutHundredths;assert.equal(e.totalHundredths,total);state=e.after;previous=board;clear=e.clearPositions;
    }
    if(e.type==='interventionPending'){pending++;assert.equal(state.pendingTier,e.tier);assert.deepEqual(e.state,state);}
    if(e.type==='winCap'){assert.equal(total,5000000);assert.equal(state.pendingTier,undefined);capped=true;}
    if(e.type==='roundEnd'){assert.equal(e.totalHundredths,total);assert.deepEqual(e.state,state);}
  }
  assert.equal(pending,confirmed+expired);assert.equal(state.pendingTier,undefined);
  assert.equal(total,book.totalHundredths);assert.ok(total<=5000000);assert.equal(book.capReached,capped);
  assert.deepEqual(book.finalState,snapshot(state));
  return true;
}
