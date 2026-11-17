import test from 'node:test';
import assert from 'node:assert/strict';
import {formatMoney} from '../public/money.mjs';
import {socialText} from '../public/social.mjs';
test('money preserves fractional cents and social balances have no currency sign',()=>{
  assert.equal(formatMoney(.000001,'USD'),'$0.000001');assert.equal(formatMoney(1.234567,'SC'),'1.234567 SC');
  assert.equal(formatMoney(1200,'XGC'),'1,200.00 GC');assert.equal(formatMoney(1,'BTC'),'BTC 1.00');
  assert.equal(formatMoney(1.25,'XEC'),'1.25 SC');
  assert.equal(formatMoney(10,'JPY'),'¥10');assert.equal(formatMoney(.000001,'JPY'),'¥0.000001');
});
test('social wording transforms new server errors, labels and replay text',()=>{
  assert.equal(socialText('BASE BET · Buy bonus · Total wager · Payout'),'BASE PLAY · Get bonus · Total play · Award');
  assert.equal(socialText('Insufficient money for this purchase'),'Insufficient coins for this play');
  assert.equal(socialText('Deposit funds · paid out · rebet · withdraw'),'Get coins balance · win · respin · redeem');
});
