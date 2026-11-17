import test from 'node:test';
import assert from 'node:assert/strict';
import {zstdCompressSync,zstdDecompressSync} from 'node:zlib';
import {catalogBook} from '../math/catalog-generator.mjs';
import {validateBook} from '../math/validate-book.mjs';
import {uploadRow} from '../scripts/export-catalog.mjs';
test('upload events preserve the authoritative result and restore from zstd',()=>{
  for(const mode of ['base','ante_15','ante_30','lesser','blood','greater','god']){
    for(const id of [0,19,241]){
      const original=catalogBook(mode,id),row=uploadRow(original,id+1),restored=JSON.parse(zstdDecompressSync(zstdCompressSync(Buffer.from(row))));
      assert.equal(restored.id,id+1);assert.equal(restored.payoutMultiplier,original.totalHundredths);
      assert.equal(restored.events.at(-1).totalHundredths,original.totalHundredths);
      assert.equal(restored.events[0].bookVersion,3);assert.equal(restored.events[0].rules.bloodThreshold,5);
    }
  }
});
test('independent book validation rejects changed payout and altered clusters',()=>{
  const book=catalogBook('greater',0);assert.equal(validateBook(book),true);
  const bad=structuredClone(book);bad.events.find(e=>e.type==='cascade').payoutHundredths++;assert.throws(()=>validateBook(bad));
  const changed=structuredClone(book);changed.events.find(e=>e.type==='board').board[0][0].symbol='S';assert.throws(()=>validateBook(changed));
});
