import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { WIN_TIERS, winTier, roundCelebration } from '../public/ceremony.mjs';

test('small returns, losses, and break-even rounds do not interrupt base play', () => {
  for (const payout of [0, .06, .9999, 1, 2, 9.9999]) {
    assert.equal(roundCelebration({ payout, cost:1, bet:1 }), null);
  }
  for (const wager of [0, -1, NaN, Infinity]) assert.equal(winTier(100, wager), null);
  assert.equal(winTier(NaN, 1), null);
});

test('celebration boundaries use the base bet at credit precision', () => {
  for (const bet of [.1, 1, 1.5, 3, 100]) {
    for (let i = 0; i < WIN_TIERS.length; i++) {
      const tier = WIN_TIERS[i], payout = bet * tier.minimum;
      assert.equal(winTier(payout, bet)?.id, tier.id);
      assert.equal(winTier(payout - .0001, bet)?.id, WIN_TIERS[i-1]?.id);
    }
  }
  assert.equal(roundCelebration({ payout:9.9999, cost:3, bet:1 }), null);
  assert.equal(roundCelebration({ payout:10, cost:3, bet:1 }).winTier, 'big');
});

test('each win tier has distinct existing artwork, text, and reveal duration', async () => {
  for (const key of ['mode', 'title', 'caption', 'countDuration']) assert.equal(new Set(WIN_TIERS.map(t => t[key])).size, 4);
  for (const tier of WIN_TIERS) await access(new URL(`../public/assets/rite-${tier.mode}.webp`, import.meta.url));
});

test('presentation preserves recorded payout and replay tier without recalculation', () => {
  const book = { payout:51.2345, cost:1, bet:1, events:[{type:'roundEnd'}] };
  const original = structuredClone(book);
  const live = roundCelebration(book), replay = roundCelebration(book, {replay:true});
  assert.equal(live.value, book.payout);
  assert.equal(live.winTier, 'epic');
  assert.equal(replay.winTier, live.winTier);
  assert.match(replay.detail, /balance has not changed/);
  assert.deepEqual(book, original);
  assert.equal(roundCelebration({...book, cost:0, noWalletChange:true}, {modeCost:3}).winTier, 'epic');
});

test('paid bonus tiers use the return above the purchase price at the base bet', () => {
  const lesser = { mode:'lesser', bet:5, cost:500 };
  const lesserOptions = { featureMode:'lesser', featureName:'Lesser Rite', modeCost:100 };
  for (const [payout, kind, title, tier] of [
    [0,'return','The rite is complete'],
    [400,'return','Round return'],
    [500,'return','Round return'],
    [549.9999,'win','You won'],
    [550,'great-win','Big win','big'],
    [750,'great-win','Epic win','epic'],
  ]) {
    const spec = roundCelebration({...lesser,payout}, lesserOptions);
    assert.equal(spec.value, payout);
    assert.equal(spec.eyebrow, 'RITUAL COMPLETE');
    assert.equal(spec.auto, false);
    assert.equal(spec.mode, 'lesser');
    assert.equal(spec.winTier, tier);
    assert.equal(spec.kind, kind);
    assert.equal(spec.title, title);
  }
  assert.equal(roundCelebration({...lesser,payout:400}, {...lesserOptions,replay:true}).title, 'Round return');
  assert.equal(roundCelebration({...lesser,cost:0,payout:550,noWalletChange:true}, lesserOptions).winTier, 'big');
  assert.equal(roundCelebration({...lesser,mode:'base',cost:5,payout:400}, lesserOptions).winTier, 'epic');

  const bonus={ mode:'greater', payout:8350.20, cost:2500, bet:5 };
  const options={ featureMode:'greater', featureName:'Greater Rite', modeCost:500 };
  const result=roundCelebration(bonus, options);
  assert.equal(result.value, bonus.payout);
  assert.equal(result.winTier, 'divine');
  assert.equal(result.title, 'Divine win');
  assert.equal(result.detail, '');
  assert.equal(result.auto, false);
});
