import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generateRound } from '../engine.mjs';
import { generateScenario } from '../scenarios.mjs';
import { planTumble, symbolArt, bookRules, bloodGeometry } from '../public/view-math.mjs';
import { RULES } from '../config.mjs';

const baseline = JSON.parse(await readFile(new URL('./fixtures/pre-pixi-outcomes.json', import.meta.url), 'utf8'));

test('all nine outcome IDs select distinct in-bounds cells across the new art sheets', async () => {
  const art = JSON.parse(await readFile(new URL('../public/assets/manifest.json', import.meta.url), 'utf8'));
  const frames = new Set();
  for (const symbol of art.symbols.order) {
    const entry = symbolArt(art, symbol);
    assert.ok(entry, symbol);
    const { frame, sheet, kind } = entry;
    assert.equal(kind, symbol === 'S' ? 'scatter' : symbol.startsWith('C') ? 'ranks' : 'symbols');
    assert.ok(frame.x >= 0 && frame.y >= 0 && frame.x + frame.width <= sheet.width && frame.y + frame.height <= sheet.height, symbol);
    frames.add(JSON.stringify([sheet.src, frame]));
  }
  assert.equal(frames.size, 9);
  assert.equal(symbolArt(art, 'unknown'), null);
  const missingRanks = structuredClone(art);
  delete missingRanks.ranks;
  assert.equal(symbolArt(missingRanks, 'C1'), null, 'A missing rank sheet must not substitute the chalice');
});

test('new books carry their rules; legacy books retain three-charge immediate playback', () => {
  const book = generateRound({ mode: 'greater', seed: 'versioned-playback' });
  assert.equal(book.version, 3);
  assert.equal(book.gdd, '1.7');
  assert.deepEqual(bookRules(book, RULES), RULES);
  assert.deepEqual(bookRules({ version: 1 }, RULES), { bloodThreshold: 3, offeringThreshold: 3, interventionTiming: 'immediate' });
});

test('blood channels support five current segments and three legacy segments without overlap', () => {
  for (const count of [3, 5]) {
    const { angles, half } = bloodGeometry(count);
    assert.equal(angles.length, count);
    for (let i = 1; i < count; i++) assert.ok(angles[i] - angles[i - 1] > half * 2);
  }
});

test('rendered tumble mapping preserves every recorded survivor and its column', () => {
  for (const id of Object.keys(baseline.scenarios)) {
    const book = generateScenario(id);
    let previous, clear;
    for (const event of book.events) {
      if (event.type === 'cascade') clear = event.clearPositions;
      if (event.type !== 'board') continue;
      if (!event.initial) {
        const moves = planTumble(previous, event.board, clear);
        assert.equal(new Set(moves.map(move => move.to)).size, 30);
        assert.equal(moves.filter(move => move.entering).length, clear.length);
        for (const move of moves.filter(move => !move.entering)) {
          assert.equal(move.from % 6, move.to % 6);
          assert.ok(move.to >= move.from);
          assert.deepEqual(previous[Math.floor(move.from / 6)][move.from % 6], event.board[Math.floor(move.to / 6)][move.to % 6]);
        }
      }
      previous = event.board;
    }
  }
});

test('visual mapping rejects a changed survivor instead of inventing an outcome', () => {
  const first = generateScenario('orphans').events.find(e => e.type === 'board').board;
  const changed = first.map(row => row.map(value => ({ ...value })));
  changed[0][0].marked = !changed[0][0].marked;
  assert.throws(() => planTumble(first, changed, []), /survivor mismatch/);
});
