import { MODES, MODEL_STATUS, RULES, SYMBOLS, TEST_MATH, TIERS, WORKING_ASSUMPTIONS } from './config.mjs';

export const cell = (symbol, marked = false) => ({ symbol, marked });
export const copyBoard = board => board.map(row => row.map(c => ({ ...c })));
export const snapshot = state => ({ tier: state.tier, blood: state.blood, offerings: state.offerings, sealed: state.tier === 2500, ...(state.pendingTier ? { pendingTier: state.pendingTier } : {}) });

export function settleIntervention(board, state) {
  if (!state.pendingTier) return null;
  if (!TIERS.includes(state.pendingTier) || state.pendingTier <= state.tier) throw new Error('Invalid pending intervention tier.');
  const confirmed = findClusters(board).length > 0;
  const tier = confirmed ? state.pendingTier : state.tier;
  return {
    type: confirmed ? 'interventionConfirmed' : 'interventionExpired',
    tier: state.pendingTier, before: snapshot(state),
    state: snapshot({ tier, blood: tier === 2500 ? 0 : state.blood, offerings: tier === 2500 ? 0 : state.offerings }),
  };
}

export function randomFromSeed(seed) {
  let value = 2166136261;
  for (const character of String(seed)) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return () => {
    value += 0x6D2B79F5;
    let t = Math.imul(value ^ value >>> 15, 1 | value);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function weighted(values, weights, random) {
  let choice = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < values.length; i++) {
    choice -= weights[i];
    if (choice < 0) return values[i];
  }
  return values.at(-1);
}

export function validateBoard(board) {
  if (!Array.isArray(board) || board.length !== 5 || board.some(row => !Array.isArray(row) || row.length !== 6)) throw new Error('Board must be 6 columns by 5 rows.');
  for (const c of board.flat()) {
    if (!c || (!SYMBOLS.includes(c.symbol) && c.symbol !== 'S') || typeof c.marked !== 'boolean' || (c.symbol === 'S' && c.marked)) throw new Error('Invalid symbol or Offering mark.');
  }
}

export function findClusters(board) {
  validateBoard(board);
  const seen = new Set();
  const clusters = [];
  for (let index = 0; index < 30; index++) {
    if (seen.has(index)) continue;
    const symbol = board[Math.floor(index / 6)][index % 6].symbol;
    seen.add(index);
    if (symbol === 'S') continue;
    const positions = [];
    const pending = [index];
    while (pending.length) {
      const p = pending.pop();
      positions.push(p);
      const row = Math.floor(p / 6), col = p % 6;
      const neighbors = [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]];
      for (const [r, c] of neighbors) {
        const next = r * 6 + c;
        if (r >= 0 && r < 5 && c >= 0 && c < 6 && !seen.has(next) && board[r][c].symbol === symbol) {
          seen.add(next);
          pending.push(next);
        }
      }
    }
    if (positions.length >= 5) clusters.push({ symbol, positions: positions.sort((a, b) => a - b), size: positions.length });
  }
  return clusters;
}

export function rawPayHundredths(symbol, size, math = TEST_MATH) {
  const band = math.bands.findLast(b => size >= b.min);
  return band ? math.payHundredths[SYMBOLS.indexOf(symbol)] * band.factor : 0;
}

export function promotionOptions(tier, math = TEST_MATH) {
  const index = TIERS.indexOf(tier);
  if (index < 0) throw new Error('Invalid promotion starting tier.');
  const minimumSteps = tier < RULES.lowTierBoundary ? RULES.lowTierMinimumSteps : RULES.highTierMinimumSteps;
  const allowed = TIERS.slice(index + minimumSteps);
  const weights = allowed.map(target => math.promotionDistanceWeights[TIERS.indexOf(target) - index - 1]);
  return { allowed, weights, minimumSteps };
}

export function allocateCap(amounts, remaining) {
  if (!Number.isSafeInteger(remaining) || remaining < 0 || amounts.some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error('Invalid cap allocation');
  const total = amounts.reduce((sum, n) => sum + BigInt(n), 0n);
  if (total <= BigInt(remaining)) return [...amounts];
  const shares = amounts.map((n, index) => ({index, paid:Number(BigInt(n)*BigInt(remaining)/total), remainder:BigInt(n)*BigInt(remaining)%total}));
  let extra = remaining - shares.reduce((sum, s) => sum + s.paid, 0);
  for (const share of [...shares].sort((a,b) => a.remainder===b.remainder ? a.index-b.index : a.remainder>b.remainder ? -1 : 1)) {
    if (!extra) break; share.paid++; extra--;
  }
  return shares.map(s => s.paid);
}

export function resolveCascade(board, state, { feature = false, random = randomFromSeed(1), selectPromotion, math = TEST_MATH, remainingPayoutHundredths = Infinity } = {}) {
  const clusters = findClusters(board);
  if (!TIERS.includes(state.tier) || !Number.isInteger(state.blood) || state.blood < 0 || state.blood >= RULES.bloodThreshold || !Number.isInteger(state.offerings) || state.offerings < 0) throw new Error('Invalid altar state.');
  if (state.pendingTier) throw new Error('Settle the pending intervention before resolving this board.');
  const before = snapshot(state);
  if (!clusters.length) return null;
  const winPositions = new Set(clusters.flatMap(c => c.positions));
  const winningTypes = new Set(clusters.map(c => c.symbol));
  const orphanPositions = board.flat().flatMap((c, index) => winningTypes.has(c.symbol) && !winPositions.has(index) ? [index] : []);
  const markedPositions = [...winPositions].filter(p => board[Math.floor(p / 6)][p % 6].marked);
  const payoutMultiplier = before.tier;
  let paidClusters = clusters.map(c => {
    const rawHundredths = rawPayHundredths(c.symbol, c.size, math);
    return { ...c, rawHundredths, uncappedPayoutHundredths:rawHundredths*payoutMultiplier, payoutHundredths:rawHundredths*payoutMultiplier, markedPositions:c.positions.filter(p => markedPositions.includes(p)) };
  });
  const uncappedPayoutHundredths = paidClusters.reduce((sum,c) => sum+c.payoutHundredths,0);
  const capReached = uncappedPayoutHundredths >= remainingPayoutHundredths;
  if (capReached) {
    const credited = allocateCap(paidClusters.map(c => c.payoutHundredths), remainingPayoutHundredths);
    paidClusters = paidClusters.map((c,i) => ({...c,payoutHundredths:credited[i]}));
    return { type:'cascade',before,after:before,normalTier:before.tier,promotedTier:null,payoutMultiplier,
      bloodCollected:0,offeringsCollected:0,clusters:paidClusters,orphanPositions,
      clearPositions:[...winPositions,...orphanPositions].sort((a,b)=>a-b),
      rawHundredths:paidClusters.reduce((sum,c)=>sum+c.rawHundredths,0),
      uncappedPayoutHundredths,payoutHundredths:remainingPayoutHundredths,capReached:true };
  }
  const sealed = before.sealed;
  const bloodCollected = sealed ? 0 : clusters.length;
  const offeringsCollected = !sealed && feature ? markedPositions.length : 0;
  const bloodTotal = sealed ? 0 : state.blood + bloodCollected;
  const tierIndex = TIERS.indexOf(state.tier);
  const normalIndex = Math.min(TIERS.length - 1, tierIndex + Math.floor(bloodTotal / RULES.bloodThreshold));
  const normalTier = TIERS[normalIndex];
  let offerings = sealed ? 0 : state.offerings + offeringsCollected;
  let promotedTier = null;
  if (feature && normalTier < 2500 && offerings >= RULES.offeringThreshold) {
    const { allowed, weights } = promotionOptions(normalTier, math);
    promotedTier = selectPromotion ? selectPromotion(normalTier, allowed) : weighted(allowed, weights, random);
    if (!allowed.includes(promotedTier)) throw new Error('Intervention must strictly exceed the post-normal tier and meet its minimum step distance.');
    offerings -= RULES.offeringThreshold;
  }
  const tier = normalTier;
  const after = snapshot({ tier, blood: tier === 2500 ? 0 : bloodTotal % RULES.bloodThreshold, offerings: tier === 2500 ? 0 : offerings, pendingTier: promotedTier });
  return {
    type: 'cascade', before, after, normalTier, promotedTier, payoutMultiplier,
    bloodCollected, offeringsCollected, clusters: paidClusters, orphanPositions,
    clearPositions: [...winPositions, ...orphanPositions].sort((a, b) => a - b),
    rawHundredths: paidClusters.reduce((a, c) => a + c.rawHundredths, 0),
    payoutHundredths: paidClusters.reduce((a, c) => a + c.payoutHundredths, 0), uncappedPayoutHundredths, capReached:false,
  };
}

export function tumble(board, clearPositions, draw) {
  const clear = new Set(clearPositions);
  const result = copyBoard(board);
  for (let col = 0; col < 6; col++) {
    const survivors = board.map((row, r) => ({ c: row[col], p: r * 6 + col })).filter(item => !clear.has(item.p)).map(item => ({ ...item.c }));
    const gap = 5 - survivors.length;
    for (let row = 0; row < gap; row++) result[row][col] = draw(row, col);
    for (let i = 0; i < survivors.length; i++) result[gap + i][col] = survivors[i];
  }
  validateBoard(result);
  return result;
}

export const countScatters = board => board.flat().filter(c => c.symbol === 'S').length;
export const naturalTier = count => count >= 5 ? 'greater' : count === 4 ? 'blood' : count === 3 ? 'lesser' : null;
export const highestBonus = (a, b) => [a, b].sort((x, y) => ['lesser', 'blood', 'greater'].indexOf(y) - ['lesser', 'blood', 'greater'].indexOf(x))[0] ?? null;

export function generateRound({ mode = 'base', seed = 'prototype', boardSource, refillSource, selectPromotion, godTier, initialState, math = TEST_MATH, mathId = 'v1.7-candidate' } = {}) {
  const spec = MODES[mode];
  if (!spec || spec.disabled) throw new Error(spec?.reason ?? 'Unknown mode.');
  if (initialState && !spec.feature) throw new Error('Scripted starting state requires a feature.');
  const random = randomFromSeed(seed);
  const events = [];
  let totalHundredths = 0, retriggerUsed = false, interventionCount = 0, interventionConfirmedCount = 0, interventionExpiredCount = 0, highest = null, capReached = false;
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
    if (feature && activeMode !== 'god' && !retriggerUsed && countScatters(board) >= 3) {
      remaining += 5;
      retriggerUsed = true;
      retriggerEvent = { type: 'retrigger', spin, added: 5, remaining, scatterCount: countScatters(board), state: snapshot(state) };
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
  emit({ type: 'roundEnd', totalHundredths, state: snapshot(state), spins: spin, retriggerUsed, interventionCount, interventionConfirmedCount, interventionExpiredCount });
  return { version: 3, gdd: '1.7', mathId, rules: RULES, mode, seed, modelStatus: MODEL_STATUS, workingAssumptions: WORKING_ASSUMPTIONS, events, totalHundredths, finalState: snapshot(state), spins: spin, retriggerUsed, interventionCount, interventionConfirmedCount, interventionExpiredCount, capReached, aborted };
}
