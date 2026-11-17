// Separate concept candidate. The v1.7 engine and calibrated catalog remain immutable.
import { MODES, RULES as LEGACY_RULES, SYMBOLS, TEST_MATH, WORKING_ASSUMPTIONS } from './config.mjs';
import { cell, copyBoard, snapshot, randomFromSeed, validateBoard, countScatters, highestBonus, naturalTier, settleIntervention, resolveCascade, tumble } from './engine.mjs';
export const REPEAT_RULES_VERSION = 'repeat-retriggers-v1';
export const MODEL_STATUS = 'REPEAT RETRIGGER CONCEPT — RTP UNVALIDATED';
export const RULES = Object.freeze({...LEGACY_RULES,retriggerSpins:5,retriggerMinScatters:3,retriggerTiming:'initial-free-spin',repeatRetriggers:true});

function weighted(values, weights, random) {
  let choice = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < values.length; i++) {
    choice -= weights[i];
    if (choice < 0) return values[i];
  }
  return values.at(-1);
}

export function generateRound({ mode = 'base', seed = 'prototype', boardSource, refillSource, selectPromotion, godTier, initialState, math = TEST_MATH, mathId = REPEAT_RULES_VERSION } = {}) {
  const spec = MODES[mode];
  if (!spec || spec.disabled) throw new Error(spec?.reason ?? 'Unknown mode.');
  if (initialState && !spec.feature) throw new Error('Scripted starting state requires a feature.');
  const random = randomFromSeed(seed);
  const events = [];
  let totalHundredths = 0, retriggerUsed = false, retriggerCount = 0, interventionCount = 0, interventionConfirmedCount = 0, interventionExpiredCount = 0, highest = null, capReached = false;
  let state = initialState ? { ...initialState } : { tier: spec.tier, blood: 0, offerings: 0 };
  let activeMode = mode, remaining = spec.spins, feature = spec.feature, spin = 0, aborted = false;
  const emit = event => events.push({ index: events.length, ...event });
  emit({ type: 'roundStart', mode, seed, state: snapshot(state), modelStatus: MODEL_STATUS, rules: RULES });
  if (mode === 'god') {
    const award = godTier ?? weighted(math.godTiers, math.godWeights, random);
    if (!math.godTiers.includes(award)) throw new Error('Invalid guaranteed God Mode tier.');
    state = { tier: award, blood: 0, offerings: 0 };
    interventionCount++;
    interventionConfirmedCount++;
    emit({ type: 'godIntervention', tier: award, state: snapshot(state) });
  }
  if (feature) emit({ type: 'featureStart', mode: activeMode, spins: remaining, state: snapshot(state), natural: false });

  const draw = (r, c, partial) => {
    const scatter = math.scatterChance[feature ? 'feature' : mode];
    if (random() < scatter) return cell('S');
    let symbol = SYMBOLS[Math.floor(random() * SYMBOLS.length)];
    if (partial && random() < math.neighborCopyChance) {
      const neighbors = [partial[r]?.[c - 1], partial[r - 1]?.[c]].filter(v => v && v.symbol !== 'S');
      if (neighbors.length) symbol = neighbors[Math.floor(random() * neighbors.length)].symbol;
    }
    return cell(symbol, feature && random() < math.offeringChance);
  };
  while (remaining > 0) {
    if (spin >= 10000) throw new Error('Generation safety guard: round aborted before any credits are committed.');
    remaining--;
    spin++;
    const context = { spin, mode: activeMode, feature, random };
    let board = boardSource?.(context);
    if (board) board = copyBoard(board);
    else {
      board = Array.from({ length: 5 }, () => []);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) board[r][c] = draw(r, c, board);
    }
    validateBoard(board);
    if (!feature && board.flat().some(c => c.marked)) throw new Error('Offering marks are forbidden in base/ante play.');
    emit({ type: 'spinStart', spin, mode: activeMode, feature, remaining, state: snapshot(state) });
    let retriggerEvent = null;
    if (feature && activeMode !== 'god' && countScatters(board) >= 3) {
      remaining += 5;
      retriggerUsed = true;
      retriggerCount++;
      retriggerEvent = { type: 'retrigger', spin, added: 5, remaining, retriggerCount, scatterCount: countScatters(board), state: snapshot(state) };
    }
    let cascade = 0;
    while (true) {
      emit({ type: 'board', spin, cascade, initial: cascade === 0, board: copyBoard(board), scatterCount: countScatters(board) });
      if (cascade === 0 && retriggerEvent) emit(retriggerEvent);
      if (!feature) highest = highestBonus(highest, naturalTier(countScatters(board)));
      const settlement = settleIntervention(board, state);
      if (settlement) {
        state = { ...settlement.state };
        if (settlement.type === 'interventionConfirmed') interventionConfirmedCount++;
        else interventionExpiredCount++;
        emit({ ...settlement, spin, cascade });
      }
      const result = resolveCascade(board, state, { feature, random, selectPromotion, math, remainingPayoutHundredths:RULES.maxWin*100-totalHundredths });
      if (!result) break;
      if (cascade >= TEST_MATH.maxCascadesPerSpin) throw new Error('Prototype safety guard: entire round aborted, no credits committed.');
      totalHundredths += result.payoutHundredths;
      if (!Number.isSafeInteger(totalHundredths)) throw new Error('Payout exceeds safe integer range; entire round aborted.');
      if (result.promotedTier) interventionCount++;
      state = { ...result.after };
      emit({ ...result, spin, cascade, totalHundredths });
      if (result.capReached) { capReached = true; remaining = 0; emit({type:'winCap',capHundredths:RULES.maxWin*100,totalHundredths,state:snapshot(state)}); break; }
      if (result.promotedTier) emit({ type: 'interventionPending', tier: result.promotedTier, state: snapshot(state), spin, cascade });
      cascade++;
      board = tumble(board, result.clearPositions, (r, c) => refillSource?.({ ...context, cascade, row: r, col: c }) ?? draw(r, c));
      if (!feature && board.flat().some(c => c.marked)) throw new Error('Offering marks are forbidden in base/ante cascades.');
    }
    emit({ type: 'spinEnd', spin, remaining, state: snapshot(state), totalHundredths });
    if (!capReached && !feature && highest) {
      activeMode = highest;
      feature = true;
      remaining = MODES[highest].spins;
      state = { tier: MODES[highest].tier, blood: 0, offerings: 0 };
      emit({ type: 'naturalBonus', mode: highest, state: snapshot(state) });
      emit({ type: 'featureStart', mode: highest, spins: remaining, state: snapshot(state), natural: true });
    }
  }
  emit({ type: 'roundEnd', totalHundredths, state: snapshot(state), spins: spin, retriggerUsed, retriggerCount, interventionCount, interventionConfirmedCount, interventionExpiredCount });
  return { version: 3, gdd: '1.8', mathId, rules: RULES, mode, seed, modelStatus: MODEL_STATUS, workingAssumptions: WORKING_ASSUMPTIONS, events, totalHundredths, finalState: snapshot(state), spins: spin, retriggerUsed, retriggerCount, interventionCount, interventionConfirmedCount, interventionExpiredCount, capReached, aborted };
}
