import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { makeServer } from '../server.mjs';
import { generateRound } from '../engine.mjs';
import { MODES, RULES, TEST_MATH } from '../config.mjs';

const rounds = Number(process.argv[2] || 100);
assert.ok(Number.isInteger(rounds) && rounds > 0);
const bet = 1, started = performance.now(), books = [], results = [];
const server = makeServer();
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const post = async (path, body) => {
  const response = await fetch(origin + path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  return result;
};
try {
  for (const [mode, spec] of Object.entries(MODES).filter(([, spec]) => spec.feature && !spec.disabled)) {
    let session = await post('/api/session', {});
    const returns = [], endingTiers = {}, guaranteedTiers = {};
    let cost = 0, paid = 0, invoked = 0, confirmed = 0, expired = 0, confirmedRounds = 0, offeredRounds = 0;
    let clusters = 0, cascades = 0, boards = 0, marks = 0, spins = 0, retriggers = 0;
    for (let index = 0; index < rounds; index++) {
      if (session.balance < spec.cost * bet) session = await post('/api/session', {});
      const before = Math.round(session.balance * 10000);
      const payload = { sessionId:session.sessionId, mode, bet, requestId:randomUUID() };
      session = await post('/api/play', payload);
      const book = session.round;
      const costUnits = Math.round(book.cost * 10000), payoutUnits = Math.round(book.payout * 10000);
      assert.equal(costUnits, Math.round(bet * spec.cost * 10000));
      assert.equal(payoutUnits, Math.round(book.totalHundredths * bet * 100));
      assert.equal(Math.round(session.balance * 10000), before - costUnits + payoutUnits);
      const repeated = generateRound({mode, seed:book.seed});
      for (const key of Object.keys(repeated)) assert.deepEqual(book[key], repeated[key], `${mode}/${index}/${key}`);
      const wins = book.events.filter(event => event.type === 'cascade');
      assert.equal(wins.reduce((total, event) => total + event.payoutHundredths, 0), book.totalHundredths);
      for (const event of wins) {
        assert.equal(event.clusters.reduce((total, cluster) => total + cluster.payoutHundredths, 0), event.payoutHundredths);
        for (const cluster of event.clusters) assert.equal(cluster.payoutHundredths, cluster.rawHundredths * event.payoutMultiplier);
      }
      const pending = book.events.filter(event => event.type === 'interventionPending').length;
      const confirmations = book.events.filter(event => event.type === 'interventionConfirmed').length;
      const expiries = book.events.filter(event => event.type === 'interventionExpired').length;
      assert.equal(pending, confirmations + expiries);
      assert.ok(!book.finalState.pendingTier);
      assert.equal(book.aborted, false);
      if (index === 0) assert.deepEqual(await post('/api/play', payload), session, 'Retry charged again');
      cost += costUnits; paid += payoutUnits; returns.push(payoutUnits / costUnits);
      invoked += pending; confirmed += confirmations; expired += expiries;
      offeredRounds += pending > 0; confirmedRounds += confirmations > 0;
      clusters += wins.reduce((total, event) => total + event.clusters.length, 0); cascades += wins.length;
      spins += book.spins; retriggers += book.retriggerUsed;
      for (const event of book.events) {
        if (event.type === 'board') { boards++; marks += event.board.flat().filter(cell => cell.marked).length; }
        if (event.type === 'godIntervention') guaranteedTiers[event.tier] = (guaranteedTiers[event.tier] || 0) + 1;
      }
      endingTiers[book.finalState.tier] = (endingTiers[book.finalState.tier] || 0) + 1;
      books.push(book);
    }
    returns.sort((a,b) => a-b);
    const percentile = p => returns[Math.max(0, Math.ceil(p * rounds) - 1)];
    results.push({ mode, name:spec.name, rounds, baseBet:bet, costPerPurchase:spec.cost * bet,
      totalSpent:cost / 10000, totalReturned:paid / 10000, net: (paid-cost) / 10000,
      observedReturnPercent:paid / cost * 100, meanReturn:paid / 10000 / rounds,
      medianReturn:percentile(.5) * spec.cost * bet, p95Return:percentile(.95) * spec.cost * bet,
      maxReturn:returns.at(-1) * spec.cost * bet, maxPurchaseMultiple:returns.at(-1),
      zeroReturns:returns.filter(value => value === 0).length, losingPurchases:returns.filter(value => value < 1).length,
      breakEvenPurchases:returns.filter(value => value === 1).length, profitablePurchases:returns.filter(value => value > 1).length,
      offeringInterventions:{invoked,confirmed,expired,roundsInvoked:offeredRounds,roundsConfirmed:confirmedRounds},
      guaranteedGodTiers:guaranteedTiers, meanSpins:spins / rounds, retriggeredRounds:retriggers,
      meanWinningCascades:cascades / rounds, meanWinningClusters:clusters / rounds,
      observedMarksPerSettledBoard:marks / boards, endingTiers,
      topFiveShareOfReturnsPercent:returns.slice(-5).reduce((a,b)=>a+b,0) / returns.reduce((a,b)=>a+b,0) * 100 });
  }
} finally { await new Promise(resolve => server.close(resolve)); }

const fingerprints = {};
for (const file of ['engine.mjs','config.mjs','server.mjs']) fingerprints[file] = createHash('sha256').update(await readFile(new URL(`../${file}`, import.meta.url))).digest('hex');
const report = { createdAt:new Date().toISOString(), elapsedSeconds:(performance.now()-started)/1000,
  method:'Actual /api/play purchase endpoint on an isolated instance of the unchanged local server. Server-generated random seeds saved in books; every outcome regenerated from its seed and compared. No scripted boards or probability overrides. Independent purchases with replenished test sessions when required.',
  validation:'Each purchase charged once; each balance, cascade sum, cluster payout, and pending resolution checked. First purchase per mode retried to verify idempotency. Live user sessions untouched.',
  limitations:'100 purchases per mode are an exploratory sample, not validated RTP. Gross return divided by actual purchase cost. God guarantees are separate from Offering interventions. Marks per settled board include surviving marks seen again after tumbles.',
  excluded:Object.entries(MODES).filter(([,s])=>s.disabled).map(([mode,s])=>({mode,reason:s.reason})),
  fingerprints, rules:RULES, testMath:TEST_MATH, results };
const work = new URL('../../work/', import.meta.url);
await mkdir(work, {recursive:true});
await writeFile(new URL('bonus-balance-latest.json', work), JSON.stringify(report,null,2));
await writeFile(new URL('bonus-balance-books.json', work), JSON.stringify(books));
const columns=['name','rounds','costPerPurchase','totalSpent','totalReturned','net','observedReturnPercent','meanReturn','medianReturn','p95Return','maxReturn','zeroReturns','losingPurchases','profitablePurchases'];
await writeFile(new URL('bonus-balance-latest.csv',work), [columns.join(','),...results.map(row=>columns.map(key=>row[key]).join(','))].join('\n'));
console.log(JSON.stringify(report,null,2));
