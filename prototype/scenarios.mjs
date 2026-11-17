import { cell, copyBoard, generateRound } from './engine.mjs';
import { SYMBOLS } from './config.mjs';

export const quietBoard = () => Array.from({ length: 5 }, (_, r) => Array.from({ length: 6 }, (_, c) => cell(SYMBOLS[(r * 2 + c) % 8])));
export function withCells(board, positions, symbol, marked = []) {
  const result = copyBoard(board);
  for (const p of positions) result[Math.floor(p / 6)][p % 6] = cell(symbol, marked.includes(p));
  return result;
}
export const oneCluster = (marked = []) => withCells(quietBoard(), [18, 19, 20, 24, 25], 'C1', marked);
export const twoClusters = () => withCells(oneCluster([18]), [3, 4, 5, 10, 11], 'P4');
export const SCENARIOS = Object.freeze({
  intervention: { name: 'Intervention confirmed', description: 'An offer becomes permanent when the following tumble wins; only that later win uses the award.' },
  intervention_expired: { name: 'Intervention expires', description: 'No next-tumble win: the earned altar remains and three Offerings stay spent.' },
  banked: { name: 'Banked Offerings', description: 'A stored sigil triggers on a later winning cascade without any new marks.' },
  cap: { name: 'Normal progression to ×2500', description: 'Normal progression seals both meters. This cascade pays at its previous altar tier.' },
  entity_cap: { name: 'Entity award of ×2500', description: 'The next winning tumble confirms ×2500, then clears and seals both meters.' },
  entity_cap_expired: { name: 'Unconfirmed ×2500', description: 'A failed ×2500 offer leaves the earned tier and surplus charges intact.' },
  natural: { name: 'Natural bonus entry', description: 'Three visible scatters award Lesser Rite after the base cascade chain.' },
  retrigger: { name: 'One retrigger', description: 'Four scatters on the initial free-spin board award +5 spins, once.' },
  god_zero: { name: 'God Mode with zero win', description: 'The guaranteed pre-spin intervention does not guarantee a payout.' },
  orphans: { name: 'Non-paying orphan clearing', description: 'A disconnected marked orphan clears without payout, blood, or Offerings.' },
});

export function generateScenario(id) {
  if (!SCENARIOS[id]) throw new Error('Unknown demonstration.');
  const opts = {
    mode: 'blood', seed: `scripted:${id}`,
    boardSource: () => quietBoard(),
    refillSource: ({ row, col }) => cell(SYMBOLS[(row * 2 + col) % 8]),
  };
  const fullBoard = () => Array.from({ length: 5 }, () => SYMBOLS.slice(0, 6).map(s => cell(s)));
  if (id === 'intervention') {
    opts.initialState = { tier: 16, blood: 0, offerings: 3 };
    opts.boardSource = ({ spin }) => spin === 1 ? fullBoard() : quietBoard();
    opts.refillSource = ({ cascade, row, col }) => cascade === 1 ? fullBoard()[row][col] : quietBoard()[row][col];
    opts.selectPromotion = (tier, allowed) => allowed.includes(120) ? 120 : allowed[0];
  } else if (id === 'intervention_expired') {
    opts.initialState = { tier: 16, blood: 4, offerings: 6 };
    opts.boardSource = ({ spin }) => spin === 1 ? oneCluster() : quietBoard();
    opts.selectPromotion = () => 120;
  } else if (id === 'banked') {
    opts.initialState = { tier: 16, blood: 0, offerings: 6 };
    opts.boardSource = ({ spin }) => spin <= 2 ? oneCluster() : quietBoard();
    opts.selectPromotion = (tier, allowed) => allowed[0];
  } else if (id === 'cap') {
    opts.initialState = { tier: 1000, blood: 4, offerings: 3 };
    opts.boardSource = ({ spin }) => spin === 1 ? oneCluster([18, 19]) : quietBoard();
  } else if (id === 'entity_cap' || id === 'entity_cap_expired') {
    opts.initialState = { tier: 500, blood: 0, offerings: 3 };
    opts.boardSource = ({ spin }) => spin === 1 ? fullBoard() : quietBoard();
    opts.refillSource = ({ cascade, row, col }) => id === 'entity_cap' && cascade === 1 ? fullBoard()[row][col] : quietBoard()[row][col];
    opts.selectPromotion = () => 2500;
  } else if (id === 'natural') {
    opts.mode = 'base';
    opts.boardSource = ({ feature }) => feature ? quietBoard() : withCells(oneCluster(), [0, 5, 8], 'S');
  } else if (id === 'retrigger') {
    opts.mode = 'lesser';
    opts.boardSource = () => withCells(quietBoard(), [0, 5, 12, 17], 'S');
  } else if (id === 'god_zero') {
    opts.mode = 'god';
    opts.godTier = 250;
  } else if (id === 'orphans') {
    opts.boardSource = ({ spin }) => spin === 1 ? withCells(oneCluster(), [5], 'C1', [5]) : quietBoard();
  }
  return { ...generateRound(opts), demonstration: id, demonstrationName: SCENARIOS[id].name, demonstrationDescription: SCENARIOS[id].description };
}
