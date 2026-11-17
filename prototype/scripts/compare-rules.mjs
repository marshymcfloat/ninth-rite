import { writeFile } from 'node:fs/promises';
import { generateRound as oldRound } from '../../work/rules-v1.4-baseline/engine.mjs';
import { generateRound } from '../../work/rules-v1.5-baseline/engine.mjs';

const count = 10000;
const results = [];
for (const [version, generate] of [['1.4', oldRound], ['1.5', generateRound]]) {
  for (const mode of ['lesser', 'blood', 'greater']) {
    let marks = 0, boards = 0, invoked = 0, confirmed = 0, expired = 0, clusters = 0;
    const endingTiers = {};
    for (let i = 0; i < count; i++) {
      const book = generate({ mode, seed: `rules-audit:${mode}:${i}` });
      invoked += book.interventionCount;
      confirmed += book.interventionConfirmedCount ?? book.interventionCount;
      expired += book.interventionExpiredCount ?? 0;
      endingTiers[book.finalState.tier] = (endingTiers[book.finalState.tier] ?? 0) + 1;
      for (const event of book.events) {
        if (event.type === 'board') { boards++; marks += event.board.flat().filter(c => c.marked).length; }
        if (event.type === 'cascade') clusters += event.clusters.length;
      }
    }
    results.push({ version, mode, rounds: count, marksPerSettledBoard: marks / boards, interventionsInvokedPerRound: invoked / count, interventionsConfirmedPerRound: confirmed / count, interventionsExpiredPerRound: expired / count, clustersPerRound: clusters / count, endingTiers });
  }
}
await writeFile(new URL('../../work/rules-comparison.json', import.meta.url), JSON.stringify({ seedPattern:'rules-audit:<mode>:<0..9999>', note:'Prototype measurements, not validated RTP. Settled boards include retained marks. Old interventions were immediately permanent.', results }, null, 2));
const legacy = oldRound({ mode: 'greater', seed: 'legacy-browser-check' });
await writeFile(new URL('../test/fixtures/legacy-v1.4-response.json', import.meta.url), JSON.stringify({ round: { ...legacy, id:'legacy-fixture', bet:1, cost:500, payout:legacy.totalHundredths/100, noWalletChange:true } }));
console.log(JSON.stringify(results));
