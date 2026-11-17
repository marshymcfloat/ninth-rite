import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {MODES,RULES_VERSION} from '../rules-v19.mjs';
const root=resolve(process.argv[2]||'../work/ninth-math-v19.1');
const read=async name=>{try{return JSON.parse(await readFile(resolve(root,name),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const report=await read('calibration-report.json'),audit=await read('audit-report.json'),verification=await read('verification-report.json'),diagnostic=await read('god-feasibility.json'),prices=await read('local-release-check.json');
const number=(v,d=4)=>Number.isFinite(v)?v.toFixed(d):'—',percent=(v,d=4)=>Number.isFinite(v)?`${(100*v).toFixed(d)}%`:'—';
const lines=[`# The Ninth Rite math review — catalog ${report.version}`,``,
  `The reweighted ${RULES_VERSION} catalog targets ${percent(report.targetRtp,2)} RTP in each mode with a tolerance of ±0.005 percentage points. The audit also checks the exact 96.0%–96.7% range in the public Stake Engine requirements. [Engine FAQ](https://stake-engine.com/docs/faq)`,
  ``, `Catalog: **${audit?.passed?'mathematical audit passed':'not validated for activation'}**. Browser/behavior verification: **${verification?.passed?'passed':'pending'}**.`,
  ``, `${report.source.validatedBooks?.toLocaleString('en-US')||'Pending'} books independently checked event by event during generation. Weight audit checks every row and file fingerprint.`,
  ``, `| Mode | Books | Cost / base bet | Start | Initial spins | RTP | Median / cost | Profit probability | SD / mode bet | Gates |`,
  `|---|---:|---:|---:|---:|---:|---:|---:|---:|---|`];
for(const [mode,spec] of Object.entries(MODES)){
  if(spec.disabled)continue;
  const s=report.results[mode]||{};
  lines.push(`| ${spec.name} | ${(s.books||report.source.results.find(r=>r.mode===mode)?.validatedBooks||0).toLocaleString('en-US')} | ${spec.cost}× | ${mode==='god'?'Guaranteed tier':`×${spec.tier}`} | ${spec.spins} | ${percent(s.rtp,8)} | ${percent(s.median/spec.cost,2)} | ${percent(s.profit,2)} | ${number(s.stdDevInModeBets,6)} | ${s.failures?.length?s.failures.join('; '):'Pass'} |`);
}
lines.push('', '## Prices and chance modes', '',
  'The price is the selected base bet multiplied by the rite’s cost factor. The total-round cap is 50,000 times the base bet in each mode. [Engine RGS pricing](https://stake-engine.com/docs/rgs)',
  '', '| Mode | Cost at 0.01 | Cost at 1.00 | Cost at 5.00 | Chance of a natural bonus |',
  '|---|---:|---:|---:|---:|');
for(const [mode,spec] of Object.entries(MODES)){
  if(spec.disabled)continue;
  const s=report.results[mode];
  lines.push(`| ${spec.name} | ${number(.01*spec.cost,3)} | ${number(spec.cost,2)} | ${number(5*spec.cost,2)} | ${spec.feature?'—':percent(s?.naturalRate,2)} |`);
}
if(prices?.passed)lines.push('',`The local server reconciled the price, payout, balance, replay and duplicate request for all ${prices.outcomes.length} mode and bet level combinations.`);
const god=report.results.god;
if(god?.books)lines.push('',`God Mode buys one spin with a guaranteed starting altar tier. The weighted median is ${percent(god.median/god.cost,2)} of its price, ${percent(1-god.nonzero,2)} of rounds pay zero, and ${percent(god.profit,2)} return more than the purchase price.`);
lines.push('', '## Exact integer-weighted RTP', '', 'RTP = weighted payout in hundredths / (total integer weight × price in hundredths). Fractions are unreduced.','');
for(const [mode,s] of Object.entries(report.results))lines.push(`- ${MODES[mode].name}: ${s.exactRtpNumerator?`${s.exactRtpNumerator} / ${s.exactRtpDenominator}`:'No feasible weights; RTP not claimed.'}`);
lines.push('', '## Recorded feature activity','', 'Counts below are weighted expectations per paid round. Invocation probability excludes the guaranteed pre-spin God intervention; additional ordinary interventions are included.','',
  '| Mode | Mean feature spins when entered | Feature spins P95 | Mean retriggers | P(retrigger) | P(invocation) | Mean invocations | First confirmations | Second confirmations | Expiries |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
for(const [mode,s] of Object.entries(report.results)){const a=s.activity||{};lines.push(`| ${MODES[mode].name} | ${number(a.meanFeatureDurationWhenTriggered)} | ${a.featureDurationP95??'—'} | ${number(a.retriggers,6)} | ${percent(a.retriggerProbability)} | ${percent(a.invocationProbability)} | ${number(a.invocations,6)} | ${number(a.firstChanceConfirmed,6)} | ${number(a.secondChanceConfirmed,6)} | ${number(a.expired,6)} |`);}
lines.push('', '## Tail and concentration checks','', '| Mode | Maximum book probability | Maximum-win probability | CVaR 99.9% / base bet | CVaR / mode bet | Max observed retriggers |','|---|---:|---:|---:|---:|---:|');
for(const [mode,s] of Object.entries(report.results))lines.push(`| ${MODES[mode].name} | ${percent(s.maxSingleBookProbability,8)} | ${percent(s.capProbability,8)} | ${number(s.cvar999BaseBets,2)} | ${number(s.cvar999ModeBets,2)} | ${s.activity?.maximumObservedRetriggers??'—'} |`);
if(diagnostic){lines.push('', '## God Mode feasibility diagnostic','',`The ${diagnostic.books.toLocaleString('en-US')}-book support required SD ≥ ${number(diagnostic.requiredStdDev,6)}. Its maximum achievable SD at 96% was ${number(diagnostic.maximumStdDevEvenWithoutCvar,6)}, even with the CVaR bound removed for diagnosis. No production constraint was relaxed.`,report.results.god?.failures?.length?'The fixed 1,000× price and safeguards remain unchanged; the candidate stays unvalidated.':'The God candidate pool was subsequently expanded; the table above reports the accepted fit.');}
lines.push('', '## Validation and preview','',
  'The independent event validator checks payouts, gravity, natural entries, spin counts, repeated retriggers, intervention deadlines, confirmation order, expiry, terminal state, and the 50,000× cap for every generated book.',
  'The fixed-weight fitter pools nearby outcomes at every constraint boundary and uses exact average payouts and second moments. The final integer weights are audited against individual, unchanged payouts.',
  verification?`Behavior checks: ${verification.tests||'see verification-report.json'}. Browser checks: ${verification.browser?.join('; ')||'pending'}.`:'Live review pending.',
  'The packaged v1.7 math uses a 100× God Mode price. The v1.9 catalog and its 1,000× price require a matching export and frontend integration. Studio validation of the v1.9 package remains pending. [Engine math file format](https://stake-engine.com/docs/math/math-file-format)',
  '', 'Files: calibration-report.json, candidate-report.json, audit-report.json, verification-report.json, targets in math/targets-v19.json.', '');
await writeFile(resolve(root,'calibration-report.md'),lines.join('\n'));console.log(resolve(root,'calibration-report.md'));
