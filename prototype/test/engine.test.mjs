import test from 'node:test';
import assert from 'node:assert/strict';
import { cell, countScatters, findClusters, generateRound, naturalTier, randomFromSeed, resolveCascade, settleIntervention, tumble } from '../engine.mjs';
import { MODES, SYMBOLS, TIERS } from '../config.mjs';
import { generateScenario, oneCluster, quietBoard, SCENARIOS, twoClusters, withCells } from '../scenarios.mjs';

const empty = () => Array.from({ length: 5 }, () => Array.from({ length: 6 }, () => cell('S')));
const state = (tier = 16, blood = 0, offerings = 0) => ({ tier, blood, offerings });

test('branching orthogonal shapes qualify; diagonal-only symbols and scatters do not', () => {
  const bent = withCells(empty(), [0, 6, 7, 13, 14], 'C1');
  assert.equal(findClusters(bent)[0].size, 5);
  assert.equal(findClusters(withCells(empty(), [0, 7, 14, 21, 28], 'C1')).length, 0);
  assert.equal(findClusters(withCells(empty(), [0, 1, 6, 7], 'C1')).length, 0);
  assert.equal(findClusters(empty()).length, 0);
});

test('disconnected qualifying groups each pay; marked orphans collect nothing', () => {
  let board = withCells(empty(), [0, 1, 2, 6, 7, 22, 23, 27, 28, 29], 'C1', [0]);
  board = withCells(board, [15], 'C1', [15]);
  const result = resolveCascade(board, state(), { feature: true });
  assert.equal(result.clusters.length, 2);
  assert.equal(result.bloodCollected, 2);
  assert.equal(result.offeringsCollected, 1);
  assert.deepEqual(result.orphanPositions, [15]);
  assert.equal(result.payoutHundredths, 2 * 10 * 16);
});

test('orphan clearing handles simultaneous winning symbol types on one snapshot', () => {
  let board = withCells(empty(), [0, 1, 2, 6, 7, 29], 'C1');
  board = withCells(board, [16, 17, 22, 23, 28, 12], 'P1');
  const result = resolveCascade(board, state());
  assert.equal(result.clusters.length, 2);
  assert.deepEqual(result.orphanPositions, [12, 29]);
  assert.equal(result.clearPositions.length, 12);
});

test('six simultaneous five-cell clusters advance one tier with one remainder', () => {
  const board = Array.from({ length: 5 }, () => SYMBOLS.slice(0, 6).map(s => cell(s)));
  const result = resolveCascade(board, state());
  assert.equal(result.clusters.length, 6);
  assert.equal(result.payoutMultiplier, 16);
  assert.equal(result.after.tier, 32);
  assert.equal(result.after.blood, 1);
});

test('five clusters from 2/5 blood advance one tier and retain 2/5', () => {
  const board = Array.from({ length: 5 }, () => [...SYMBOLS.slice(0, 5), 'S'].map(s => cell(s)));
  const result = resolveCascade(board, state(16, 2));
  assert.equal(result.after.tier, 32);
  assert.equal(result.after.blood, 2);
  assert.equal(result.payoutMultiplier, 16);
});

test('normal progression precedes pending intervention; triggering clusters use the old tier', () => {
  const result = resolveCascade(twoClusters(), state(16, 4, 2), { feature: true, selectPromotion: normal => { assert.equal(normal, 32); return 120; } });
  assert.equal(result.clusters.length, 2);
  assert.equal(result.payoutMultiplier, 16);
  assert.equal(result.after.tier, 32);
  assert.equal(result.after.pendingTier, 120);
  assert.equal(result.after.blood, 1);
  assert.equal(result.after.offerings, 0);
  assert.equal(result.payoutHundredths, result.rawHundredths * 16);
});

test('multiple marked winning symbols collect independently of one ordinary cluster charge', () => {
  const result = resolveCascade(oneCluster([18, 19]), state(), { feature: true });
  assert.equal(result.bloodCollected, 1);
  assert.equal(result.offeringsCollected, 2);
});

test('six banked Offerings cause one intervention without new marks, preserving three', () => {
  const result = resolveCascade(oneCluster(), state(16, 0, 6), { feature: true, selectPromotion: () => 64 });
  assert.equal(result.offeringsCollected, 0);
  assert.equal(result.promotedTier, 64);
  assert.equal(result.after.offerings, 3);
  assert.equal(settleIntervention(quietBoard(), result.after).type, 'interventionExpired');
});

test('normal arrival at ×2500 suppresses intervention and retains previous payout tier', () => {
  const result = resolveCascade(oneCluster([18]), state(1000, 4, 5), { feature: true, selectPromotion: () => assert.fail('Must not draw an intervention') });
  assert.equal(result.payoutMultiplier, 1000);
  assert.equal(result.promotedTier, null);
  assert.deepEqual(result.after, { tier: 2500, blood: 0, offerings: 0, sealed: true });
});

test('entity offer at ×2500 only seals on next-board confirmation', () => {
  const result = resolveCascade(oneCluster([18]), state(500, 1, 6), { feature: true, selectPromotion: () => 2500 });
  assert.equal(result.payoutMultiplier, 500);
  assert.deepEqual(result.after, { tier: 500, blood: 2, offerings: 4, sealed: false, pendingTier: 2500 });
  const confirmed = settleIntervention(oneCluster([18]), result.after);
  assert.deepEqual(confirmed.state, { tier: 2500, blood: 0, offerings: 0, sealed: true });
  const next = resolveCascade(oneCluster([18]), confirmed.state, { feature: true });
  assert.equal(next.bloodCollected, 0);
  assert.equal(next.offeringsCollected, 0);
  assert.equal(next.payoutMultiplier, 2500);
});

test('interventions cannot repeat or decrease the post-normal tier', () => {
  assert.throws(() => resolveCascade(oneCluster(), state(16, 0, 3), { feature: true, selectPromotion: () => 16 }), /strictly exceed/);
});

test('gravity preserves scatter identity and marks while refilling at the top', () => {
  const board = quietBoard();
  board[1][0] = cell('S');
  board[2][0] = cell('P1', true);
  const moved = tumble(board, [18, 24], () => cell('C4'));
  assert.deepEqual(moved[3][0], cell('S'));
  assert.deepEqual(moved[4][0], cell('P1', true));
  assert.deepEqual(moved[0][0], cell('C4'));
  assert.deepEqual(board[1][0], cell('S'));
});

test('natural thresholds use simultaneous counts, not cumulative appearances', () => {
  assert.deepEqual([2, 3, 4, 5, 6].map(naturalTier), [null, 'lesser', 'blood', 'greater', 'greater']);
  const low = withCells(oneCluster(), [0, 5], 'S');
  const book = generateRound({ boardSource: () => low, refillSource: ({ row, col }) => quietBoard()[row][col] });
  assert.equal(book.events.filter(e => e.type === 'naturalBonus').length, 0);
});

test('natural bonus chooses highest tier once after the base cascade chain', () => {
  const initial = withCells(oneCluster(), [0, 5, 8], 'S');
  const book = generateRound({ seed: 'natural-highest', boardSource: ({ feature }) => feature ? quietBoard() : initial, refillSource: ({ row, col }) => (row === 0 && col === 0) || (row === 0 && col === 1) ? cell('S') : quietBoard()[row][col] });
  const awards = book.events.filter(e => e.type === 'naturalBonus');
  assert.equal(awards.length, 1);
  assert.equal(awards[0].mode, 'greater');
  const awardIndex = book.events.findIndex(e => e.type === 'naturalBonus');
  const lastBaseCascade = book.events.findLastIndex(e => e.type === 'cascade' && e.spin === 1);
  assert.ok(awardIndex > lastBaseCascade);
  assert.deepEqual(awards[0].state, { tier: 32, blood: 0, offerings: 0, sealed: false });
});

for (const count of [3, 4, 5]) test(`${count} initial free-spin scatters retrigger once; scatters pay nothing`, () => {
  const board = withCells(quietBoard(), [0, 5, 12, 17, 24].slice(0, count), 'S');
  const book = generateRound({ mode: 'lesser', boardSource: () => board });
  assert.equal(book.spins, 15);
  assert.equal(book.events.filter(e => e.type === 'retrigger').length, 1);
  assert.ok(book.events.findIndex(e => e.type === 'retrigger') > book.events.findIndex(e => e.type === 'board'), 'Show the initial board before announcing its retrigger');
  assert.equal(book.totalHundredths, 0);
});

test('later cascade scatters do not retrigger', () => {
  const book = generateRound({ mode: 'lesser', boardSource: ({ spin }) => spin === 1 ? oneCluster() : quietBoard(), refillSource: () => cell('S') });
  assert.equal(book.retriggerUsed, false);
  assert.equal(book.spins, 10);
  assert.ok(book.events.some(e => e.type === 'board' && !e.initial && e.scatterCount >= 3));
});

test('retrigger preserves altar and both charge counters', () => {
  const book = generateRound({ mode: 'blood', initialState: state(120, 2, 4), boardSource: () => withCells(quietBoard(), [0, 5, 12], 'S') });
  const event = book.events.find(e => e.type === 'retrigger');
  assert.deepEqual(event.state, { tier: 120, blood: 2, offerings: 4, sealed: false });
});

test('God Mode intervenes before its only board; zero wins and no extra spins are possible', () => {
  const book = generateScenario('god_zero');
  assert.equal(book.spins, 1);
  assert.equal(book.totalHundredths, 0);
  assert.equal(book.retriggerUsed, false);
  assert.ok(book.events.findIndex(e => e.type === 'godIntervention') < book.events.findIndex(e => e.type === 'board'));
  const scatters = generateRound({ mode: 'god', godTier: 2500, boardSource: empty });
  assert.equal(scatters.spins, 1);
  assert.equal(scatters.retriggerUsed, false);
});

test('all base/ante boards and cascades omit marks; unrelated wagers reset state', () => {
  for (const mode of ['base', 'ante_15', 'ante_30']) {
    const book = generateRound({ mode, seed: 'mark-check' });
    const baseBoards = book.events.filter(e => e.type === 'board' && e.spin === 1);
    assert.ok(baseBoards.every(e => e.board.flat().every(c => !c.marked)));
    assert.deepEqual(book.events[0].state, { tier: 1, blood: 0, offerings: 0, sealed: false });
  }
});

test('all scenarios finish and reconcile every credited cluster and cascade', () => {
  for (const id of Object.keys(SCENARIOS)) {
    const book = generateScenario(id);
    const cascades = book.events.filter(e => e.type === 'cascade');
    assert.equal(book.totalHundredths, cascades.reduce((sum, e) => sum + e.payoutHundredths, 0));
    for (const e of cascades) assert.equal(e.payoutHundredths, e.clusters.reduce((sum, c) => sum + c.payoutHundredths, 0));
    assert.equal(book.events.at(-1).type, 'roundEnd');
  }
});

test('seeded outcomes are deterministic and cannot be changed by animation', () => {
  const first = generateRound({ mode: 'greater', seed: 'replay' });
  assert.deepEqual(generateRound({ mode: 'greater', seed: 'replay' }), first);
  assert.equal(randomFromSeed('same')(), randomFromSeed('same')());
});

test('seeded mode sweep preserves payout and tier invariants without claiming RTP', () => {
  for (const mode of Object.keys(MODES).filter(m => !MODES[m].disabled)) for (let seed = 0; seed < 25; seed++) {
    const book = generateRound({ mode, seed: `sweep-${seed}` });
    assert.equal(book.totalHundredths, book.events.filter(e => e.type === 'cascade').reduce((sum, e) => sum + e.payoutHundredths, 0));
    for (const e of book.events.filter(e => e.type === 'cascade')) {
      assert.ok(TIERS.includes(e.after.tier));
      assert.ok(e.after.tier >= e.before.tier);
      assert.ok(e.after.blood < 5 && e.after.blood >= 0);
      if (e.after.sealed) assert.equal(e.after.blood + e.after.offerings, 0);
    }
  }
});

test('undefined Mystery/Epic cannot silently charge or substitute another feature', () => {
  assert.throws(() => generateRound({ mode: 'mystery' }), /Epic Rite/);
});
