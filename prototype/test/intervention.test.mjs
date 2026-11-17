import test from 'node:test';
import assert from 'node:assert/strict';
import { cell, generateRound, resolveCascade, settleIntervention } from '../engine.mjs';
import { RULES, SYMBOLS, TEST_MATH } from '../config.mjs';
import { oneCluster, quietBoard, generateScenario } from '../scenarios.mjs';

const fullBoard = () => Array.from({ length: 5 }, () => SYMBOLS.slice(0, 6).map(s => cell(s)));

test('four charges wait; the fifth upgrades once and pays at the old tier', () => {
  let state = { tier: 16, blood: 0, offerings: 0 };
  for (let i = 1; i <= 5; i++) {
    const result = resolveCascade(oneCluster(), state);
    assert.equal(result.payoutMultiplier, 16);
    assert.equal(result.after.tier, i === 5 ? 32 : 16);
    assert.equal(result.after.blood, i % 5);
    state = result.after;
  }
  const overflow = resolveCascade(fullBoard(), { tier: 16, blood: 4, offerings: 0 });
  assert.equal(overflow.after.tier, 64);
  assert.equal(overflow.after.blood, 0);
});

test('confirmed example: ×16 pays, ×32 is earned, ×120 needs the next winning board', () => {
  const result = resolveCascade(oneCluster([18]), { tier: 16, blood: 4, offerings: 2 }, { feature: true, selectPromotion: normal => { assert.equal(normal, 32); return 120; } });
  assert.equal(result.payoutMultiplier, 16);
  assert.deepEqual(result.after, { tier: 32, blood: 0, offerings: 0, sealed: false, pendingTier: 120 });
  const confirmed = settleIntervention(oneCluster(), result.after);
  assert.equal(confirmed.type, 'interventionConfirmed');
  const next = resolveCascade(oneCluster(), confirmed.state, { feature: true });
  assert.equal(next.payoutMultiplier, 120);
  assert.equal(next.after.tier, 120);
  const expired = settleIntervention(quietBoard(), result.after);
  assert.equal(expired.type, 'interventionExpired');
  assert.deepEqual(expired.state, { tier: 32, blood: 0, offerings: 0, sealed: false });
});

test('failed offer keeps blood remainder and surplus, but never refunds the three spent', () => {
  const result = resolveCascade(oneCluster(), { tier: 16, blood: 2, offerings: 7 }, { feature: true, selectPromotion: () => 120 });
  assert.equal(result.after.offerings, 4);
  const expired = settleIntervention(quietBoard(), result.after);
  assert.deepEqual(expired.state, { tier: 16, blood: 3, offerings: 4, sealed: false });
});

test('pending ×2500 does not seal or discard charges when the next board loses', () => {
  const result = resolveCascade(oneCluster(), { tier: 500, blood: 1, offerings: 7 }, { feature: true, selectPromotion: () => 2500 });
  assert.equal(result.after.sealed, false);
  assert.deepEqual(settleIntervention(quietBoard(), result.after).state, { tier: 500, blood: 2, offerings: 4, sealed: false });
});

test('confirmation can invoke another banked set, once per cascade, using the confirmed tier for payout', () => {
  const first = resolveCascade(oneCluster(), { tier: 16, blood: 0, offerings: 9 }, { feature: true, selectPromotion: () => 120 });
  assert.equal(first.after.offerings, 6);
  const confirmed = settleIntervention(oneCluster(), first.after);
  const second = resolveCascade(oneCluster(), confirmed.state, { feature: true, selectPromotion: () => 500 });
  assert.equal(second.payoutMultiplier, 120);
  assert.equal(second.after.tier, 120);
  assert.equal(second.after.pendingTier, 500);
  assert.equal(second.after.offerings, 3);
});

test('expiry is recorded before spin end and cannot spill into another free spin', () => {
  const book = generateRound({ mode: 'blood', initialState: { tier: 16, blood: 4, offerings: 3 }, boardSource: ({ spin }) => spin <= 2 ? fullBoard() : quietBoard(), refillSource: ({ row, col }) => quietBoard()[row][col], selectPromotion: () => 250 });
  const expiry = book.events.find(e => e.type === 'interventionExpired');
  const end = book.events.find(e => e.type === 'spinEnd');
  assert.ok(expiry.index < end.index);
  assert.equal(end.state.pendingTier, undefined);
  assert.equal(book.events.find(e => e.type === 'cascade' && e.spin === 2).payoutMultiplier, 64);
  assert.equal(book.interventionConfirmedCount, 0);
  assert.equal(book.interventionExpiredCount, 1);
  assert.equal(book.interventionCount, 1);
});

test('demonstrations exercise confirmed, expired and cap branches, with ordered settlement', () => {
  for (const [id, type] of [['intervention','interventionConfirmed'], ['intervention_expired','interventionExpired'], ['entity_cap','interventionConfirmed'], ['entity_cap_expired','interventionExpired']]) {
    const book = generateScenario(id);
    const event = book.events.find(e => e.type === type);
    assert.ok(event, id);
    assert.equal(book.events[event.index - 1].type, 'board');
    assert.equal(book.events[event.index + 1].type, type === 'interventionConfirmed' ? 'cascade' : 'spinEnd');
    assert.equal(book.finalState.pendingTier, undefined);
    assert.equal(book.interventionCount, book.interventionConfirmedCount + book.interventionExpiredCount);
  }
});

test('God guarantee remains permanent even with no win', () => {
  const book = generateScenario('god_zero');
  assert.equal(book.finalState.tier, 250);
  assert.equal(book.interventionConfirmedCount, 1);
  assert.equal(book.interventionExpiredCount, 0);
  assert.equal(book.totalHundredths, 0);
});

test('revised frequencies and separate thresholds are explicit', () => {
  assert.equal(TEST_MATH.offeringChance, .04);
  assert.equal(RULES.bloodThreshold, 5);
  assert.equal(RULES.offeringThreshold, 3);
  assert.throws(() => resolveCascade(oneCluster(), { tier: 16, blood: 5, offerings: 0 }), /Invalid altar/);
});
