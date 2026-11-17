// All numerical math below is disposable test data, not an approved paytable or RTP model.
export const MODEL_STATUS = 'UNVALIDATED CANDIDATE MATH — GDD v1.7';
export const RULES = Object.freeze({ bloodThreshold: 5, offeringThreshold: 3, interventionTiming: 'next-tumble', lowTierBoundary: 120, lowTierMinimumSteps: 2, highTierMinimumSteps: 1, maxWin:50000 });
export const TIERS = Object.freeze([1, 2, 4, 8, 16, 32, 64, 120, 250, 500, 1000, 2500]);
export const SYMBOLS = Object.freeze(['C1', 'C2', 'C3', 'C4', 'P1', 'P2', 'P3', 'P4']);
export const MODES = Object.freeze({
  base: { name: 'Standard', cost: 1, spins: 1, tier: 1, feature: false },
  ante_15: { name: 'Enhanced Chance', cost: 1.5, spins: 1, tier: 1, feature: false },
  ante_30: { name: 'Maximum Chance', cost: 3, spins: 1, tier: 1, feature: false },
  lesser: { name: 'Lesser Rite', cost: 100, spins: 10, tier: 8, feature: true },
  blood: { name: 'Blood Rite', cost: 200, spins: 12, tier: 16, feature: true },
  greater: { name: 'Greater Rite', cost: 500, spins: 12, tier: 32, feature: true },
  mystery: { name: 'Mystery Rite', cost: 250, disabled: true, reason: 'Epic Rite is not defined in GDD v1.6.' },
  god: { name: 'God Mode', cost: 1500, spins: 1, tier: 1, feature: true },
});
export const TEST_MATH = Object.freeze({
  payHundredths: [10, 12, 15, 18, 25, 35, 50, 75],
  bands: [{ min: 5, factor: 1 }, { min: 7, factor: 2 }, { min: 10, factor: 4 }, { min: 15, factor: 8 }, { min: 20, factor: 16 }],
  scatterChance: { base: 0.025, ante_15: 0.045, ante_30: 0.075, feature: 0.025 },
  offeringChance: 0.04,
  neighborCopyChance: 0.23,
  promotionDistanceWeights: [55, 24, 11, 5, 3, 1, 0.5, 0.25, 0.125, 0.0625, 0.03125],
  godTiers: [250, 500, 1000, 2500],
  godWeights: [65, 25, 9, 1],
  // The total-round cap is separate from the safety guard, which aborts invalid generation.
  maxCascadesPerSpin: 200,
});
export const WORKING_ASSUMPTIONS = [
  'Orphans of each winning type clear together using the same pre-clear board.',
  'Natural bonuses use purchased spin counts/starting tiers, reset both meters, and belong to the same round.',
  'All raw payouts, symbol/scatter/mark frequencies and promotion weights are disposable test values.',
  'Total round returns are capped at 50,000 base bets. Mystery is disabled until Epic Rite is defined.',
];
