import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {randomFromSeed} from '../engine.mjs';
import {catalogBook} from '../math/catalog-generator.mjs';
import {validateBook} from '../math/validate-book.mjs';
const root=resolve(process.env.NINTH_MATH_DIR||'../work/ninth-math'),path=resolve(root,'calibration-report.json');
const report=JSON.parse(await readFile(path,'utf8')),baseline=JSON.parse(await readFile(resolve(root,'baseline-report.json'),'utf8'));
const audit={at:new Date().toISOString(),allBooksValidated:false,scope:'Representative books and all integer lookup rows. Full independent book validation occurs during export.',modes:{}};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const [mode,stats] of Object.entries(report.results)){
  if(!stats.books)continue;
  const outcomes=await readFile(resolve(root,`candidate-${mode}.bin`)),weights=await readFile(resolve(root,`weights-${mode}.bin`));
  if(outcomes.length!==stats.books*32||weights.length!==stats.books*8)throw Error('Truncated catalog');
  const cumulative=new Float64Array(stats.books);let sum=0n,numerator=0n,cap=0n,positive=0;const ids={cap:1};
  for(let i=0;i<stats.books;i++){
    const value=outcomes.readUInt32LE(i*32),w=weights.readBigUInt64LE(i*8);sum+=w;numerator+=BigInt(value)*w;cumulative[i]=Number(sum);positive+=w>0n;
    if(value===5000000)cap+=w;
    if(value===0)ids.zero??=i+1;if(value>0&&value<stats.cost*100)ids.smallReturn??=i+1;
    if(value>stats.cost*1000&&value<5000000)ids.bigWin??=i+1;
    if(outcomes.readUInt32LE(i*32+8)>0)ids.naturalFeature??=i+1;
    if(outcomes.readUInt32LE(i*32+12)>0)ids.interventionConfirmed??=i+1;
    if(outcomes.readUInt32LE(i*32+28)>0)ids.retrigger??=i+1;
  }
  const denominator=sum*BigInt(Math.round(stats.cost*100)),rtp=Number(numerator)/Number(denominator);
  if(Math.abs(rtp-.965)>.00005)throw Error(`${mode}: RTP audit failed`);
  if(String(numerator)!==stats.exactRtpNumerator||String(denominator)!==stats.exactRtpDenominator)throw Error('Exact weighted sums disagree');
  for(const id of new Set([...Object.values(ids),...Array.from({length:100},(_,i)=>1+Math.floor(i*stats.books/100))])){
    const book=catalogBook(mode,id-1);validateBook(book);if(book.totalHundredths!==outcomes.readUInt32LE((id-1)*32))throw Error('Seed regeneration mismatch');
  }
  const random=randomFromSeed('weighted-audit-'+mode),n=100000;let sampled=0,hit=0,profit=0;
  for(let i=0;i<n;i++){
    const ticket=Math.floor(random()*Number(sum));let lo=0,hi=stats.books-1;
    while(lo<hi){const mid=(lo+hi)>>>1;if(cumulative[mid]>ticket)hi=mid;else lo=mid+1;}
    const value=outcomes.readUInt32LE(lo*32)/100;sampled+=value;hit+=value>0;profit+=value>stats.cost;
  }
  stats.weightsSha256=hash(weights);stats.candidatesSha256=hash(outcomes);
  audit.modes[mode]={rtp,positiveWeightBooks:positive,maximumFrequency:Number(cap)/Number(sum),reviewerIds:ids,
    sampling:{rounds:n,rtp:sampled/n/stats.cost,hitRate:hit/n,profitRate:profit/n,standardErrorRtp:stats.stdDevInModeBets/Math.sqrt(n),conservative95HalfWidth:stats.stdDevInModeBets/Math.sqrt(.05*n),note:'Sampling diagnostic only; exact catalog sums establish theoretical RTP.'}};
}
await writeFile(path,JSON.stringify(report,null,2));await writeFile(resolve(root,'catalog-audit.json'),JSON.stringify(audit,null,2));
const lines=['# THE NINTH RITE — mathematical candidate report','','Not approved or published. No validated RTP is claimed for the live generator.','',
 '| Mode | Baseline raw return | Weighted RTP | Median / cost | Profit rate | Confirmed Offering | Cost | Gates |',
 '|---|---:|---:|---:|---:|---:|---:|---|'];
for(const [mode,s] of Object.entries(report.results)){
  const prior=baseline.results.find(x=>x.mode===mode);
  lines.push(`| ${mode} | ${(100*prior.observedRtp).toFixed(2)}% | ${s.rtp===undefined?'—':(s.rtp*100).toFixed(5)+'%'} | ${s.median===undefined?'—':(s.median/s.cost*100).toFixed(1)+'%'} | ${s.profit===undefined?'—':(s.profit*100).toFixed(1)+'%'} | ${s.confirmed===undefined?'—':(s.confirmed*100).toFixed(1)+'%'} | ${s.cost??'—'}× | ${s.failures.length?s.failures.join(', '):'Candidate checks passed'} |`);
}
lines.push('','Baseline: 100,000 rounds per mode from the preserved v1.6 engine. Candidate: one million rule-valid outcomes per mode, including explicitly sampled rare cap paths. All weighting is fixed; payouts are never edited to fit RTP.','',
 'The JSON report includes exact integer RTP fractions, quantiles, natural-feature distributions, standard deviations, top-0.1% CVaR, tail probabilities and expected liabilities. Risk reconciliation with Studio is pending; ETL constraints currently use a conservative interpretation.','',
 'Storage: the full export requires approximately 11.4 GB free including reserve, based on 500 compressed sample books per mode. Compact files preserve seeds, outcome statistics and weights. Full book validation/export is incomplete until that gate is cleared.','',
 'Remaining release gates: actual account integration; Studio risk and bet-limit reconciliation; complete export validation; final image/font rights audit; final audio and presentation; reviewed marketing assets; account-specific submission checklist. No submission was performed.');
await writeFile(resolve(root,'MATHEMATICAL_REPORT.md'),lines.join('\n'));console.log(JSON.stringify({modes:Object.keys(audit.modes),ready:report.ready,audit:resolve(root,'catalog-audit.json')}));
