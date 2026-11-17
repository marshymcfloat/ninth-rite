import { generateRound, cell } from '../engine.mjs';
import { TEST_MATH, SYMBOLS } from '../config.mjs';

export function catalogBook(mode, index, math = TEST_MATH) {
  const seed = `ninth-v1.7:${mode}:${index}`;
  if (index !== 0) return generateRound({mode,seed,math});
  // A valid rare cap path: only supported symbols/tiers; normal resolution and progression still apply.
  const quiet = () => Array.from({length:5},(_,r)=>Array.from({length:6},(_,c)=>cell(SYMBOLS[(r*2+c)%8])));
  return generateRound({mode,seed,math,
    boardSource:({feature}) => {
      if (feature) return Array.from({length:5},()=>Array.from({length:6},()=>cell('P4')));
      const board=quiet();for(const p of [1,10,25])board[Math.floor(p/6)][p%6]=cell('S');return board;
    },
    refillSource:()=>cell('P4')});
}

export function summarizeBook(book) {
  let base=0, feature=false, natural=0, confirmed=0, clusters=0, boards=0, marks=0;
  for (const e of book.events) {
    if (e.type==='featureStart') feature=true;
    if (e.type==='naturalBonus') natural=['lesser','blood','greater'].indexOf(e.mode)+1;
    if (e.type==='interventionConfirmed') confirmed++;
    if (e.type==='board') {boards++;marks+=e.board.flat().filter(c=>c.marked).length;}
    if (e.type==='cascade') {clusters+=e.clusters.length;if(!feature)base+=e.payoutHundredths;}
  }
  return {payout:book.totalHundredths,base,natural,confirmed,cap:Number(Boolean(book.capReached)),clusters,spins:book.spins,retrigger:Number(book.retriggerUsed),boards,marks};
}
