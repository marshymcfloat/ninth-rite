import test from 'node:test';
import assert from 'node:assert/strict';
import { promotionOptions, resolveCascade, generateRound } from '../engine.mjs';
import { RULES, TEST_MATH, TIERS } from '../config.mjs';
import { oneCluster } from '../scenarios.mjs';

test('minimum award follows the actual ladder, with a one-step floor from ×120', () => {
  for (const [tier, target] of [[1,4],[2,8],[4,16],[8,32],[16,64],[32,120],[64,250],[120,250],[250,500],[500,1000],[1000,2500]]) {
    const options = promotionOptions(tier);
    assert.equal(options.allowed[0], target);
    assert.equal(options.minimumSteps, tier < 120 ? 2 : 1);
    assert.equal(options.allowed.at(-1), 2500);
  }
  assert.deepEqual(promotionOptions(2500).allowed, []);
  assert.throws(() => promotionOptions(123), /Invalid/);
});

test('filtering preserves original target weights, rather than shifting weights to larger awards', () => {
  for (const tier of TIERS) {
    const { allowed, weights } = promotionOptions(tier);
    for (let i = 0; i < allowed.length; i++) {
      assert.equal(weights[i], TEST_MATH.promotionDistanceWeights[TIERS.indexOf(allowed[i]) - TIERS.indexOf(tier) - 1]);
    }
  }
  assert.equal(promotionOptions(16).weights[0], 24);
  assert.equal(promotionOptions(120).weights[0], 55);
});

test('minimum is evaluated after normal progress, including crossing the ×120 boundary', () => {
  const low = resolveCascade(oneCluster(), { tier: 16, blood: 4, offerings: 3 }, { feature: true, random: () => 0 });
  assert.equal(low.normalTier, 32);
  assert.equal(low.promotedTier, 120);
  assert.equal(low.payoutMultiplier, 16);
  const boundary = resolveCascade(oneCluster(), { tier: 64, blood: 4, offerings: 3 }, { feature: true, random: () => 0 });
  assert.equal(boundary.normalTier, 120);
  assert.equal(boundary.promotedTier, 250);
  assert.equal(boundary.payoutMultiplier, 64);
  assert.throws(() => resolveCascade(oneCluster(), { tier: 16, blood: 0, offerings: 3 }, { feature: true, selectPromotion: () => 32 }), /minimum step/);
});

test('seeded offers obey the floor and confirm or expire exactly once', () => {
  for (const mode of ['lesser','blood','greater','god']) for (let i = 0; i < 200; i++) {
    const book = generateRound({ mode, seed: `floor-check:${i}` });
    for (const e of book.events.filter(e => e.type === 'cascade' && e.promotedTier)) {
      const jump = TIERS.indexOf(e.promotedTier) - TIERS.indexOf(e.normalTier);
      assert.ok(jump >= (e.normalTier < RULES.lowTierBoundary ? 2 : 1));
      assert.equal(e.payoutMultiplier, e.before.tier);
    }
    assert.equal(book.interventionCount, book.interventionConfirmedCount + book.interventionExpiredCount);
    assert.equal(book.finalState.pendingTier, undefined);
  }
});
