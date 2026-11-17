import { writeFile } from 'node:fs/promises';
import { generateRound as previous } from '../../work/rules-v1.5-baseline/engine.mjs';
import { generateRound as current } from '../engine.mjs';

const rounds = 10000, results = [];
for (const [version, generate] of [['1.5',previous],['1.6',current]]) for (const mode of ['lesser','blood','greater']) {
  const payouts = [], tiers = {};
  let invoked = 0, confirmed = 0, withoutConfirmation = 0, gain = 0, marks = 0, boards = 0;
  for (let i = 0; i < rounds; i++) {
    const book = generate({ mode, seed: `promotion-audit:${mode}:${i}` });
    payouts.push(book.totalHundredths / 100);
    invoked += book.interventionCount;
    confirmed += book.interventionConfirmedCount;
    withoutConfirmation += book.interventionConfirmedCount === 0;
    tiers[book.finalState.tier] = (tiers[book.finalState.tier] ?? 0) + 1;
    for (const e of book.events) {
      if (e.type === 'interventionConfirmed') gain += e.tier / e.before.tier;
      if (e.type === 'board') { boards++; marks += e.board.flat().filter(c => c.marked).length; }
    }
  }
  payouts.sort((a,b)=>a-b);
  const quantile = p => payouts[Math.ceil(p * rounds) - 1];
  results.push({version,mode,rounds,invokedPerBonus:invoked/rounds,confirmedPerBonus:confirmed/rounds,withoutConfirmationPercent:withoutConfirmation/rounds*100,meanConfirmedTierFactor:gain/confirmed,marksPerSettledBoard:marks/boards,meanReturn:payouts.reduce((a,b)=>a+b,0)/rounds,medianReturn:quantile(.5),p95Return:quantile(.95),p99Return:quantile(.99),maxReturn:payouts.at(-1),returnsAtLeast1000:payouts.filter(p=>p>=1000).length,endingTiers:tiers});
}
await writeFile(new URL('../../work/promotion-floor-comparison.json',import.meta.url),JSON.stringify({seedPattern:'promotion-audit:<mode>:<0..9999>',returnUnit:'multiples of base bet; gross return, not profit',results},null,2));
console.log(JSON.stringify(results.map(({endingTiers,...r})=>r)));
