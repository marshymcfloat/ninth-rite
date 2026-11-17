import test from 'node:test';
import assert from 'node:assert/strict';
import { purchaseEntryBoard } from '../public/view-math.mjs';
import { quietBoard } from '../scenarios.mjs';
import { countScatters, findClusters, naturalTier } from '../engine.mjs';

test('purchase ceremony matches entry thresholds without paying clusters or Offerings',()=>{
  const source=quietBoard(), before=structuredClone(source);
  for(const [mode,count] of [['lesser',3],['blood',4],['greater',5],['god',1]]){
    const board=purchaseEntryBoard(mode,source);
    assert.equal(countScatters(board),count);
    assert.equal(findClusters(board).length,0);
    assert.ok(board.flat().every(cell=>!cell.marked));
    if(mode!=='god')assert.equal(naturalTier(count),mode);
  }
  assert.deepEqual(source,before);
  for(const mode of ['base','ante_15','ante_30','mystery'])assert.equal(purchaseEntryBoard(mode,source),null);
});
