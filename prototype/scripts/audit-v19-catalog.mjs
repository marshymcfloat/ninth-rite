import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {MODES,RULES_VERSION} from '../rules-v19.mjs';
const root=resolve(process.argv[2]||'../work/ninth-math-v19.1');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const targetsBytes=await readFile(new URL('../math/targets-v19.json',import.meta.url));
const targets=JSON.parse(targetsBytes),report=JSON.parse(await readFile(resolve(root,'calibration-report.json'),'utf8'));
const source=JSON.parse(await readFile(resolve(root,'candidate-report.json'),'utf8'));
const audit={rulesVersion:RULES_VERSION,passed:false,allBooksValidated:source.allBooksValidated,validatedBooks:source.validatedBooks,targetsSha256:hash(targetsBytes),failures:[],results:{}};
const fail=reason=>audit.failures.push(reason);
if(!source.allBooksValidated||source.validatedBooks<targets.minCandidateBooks*7||JSON.stringify(report.source)!==JSON.stringify(source))fail('Incomplete or mismatched book validation certificate');
for(const name of ['engine.mjs','config.mjs','engine-v19.mjs','rules-v19.mjs','math/catalog-v19-generator.mjs','math/validate-v19-book.mjs']){
  if(hash(await readFile(new URL('../'+name,import.meta.url)))!==source.fingerprints[name])fail(`Source fingerprint: ${name}`);
}
let previousNatural=0;
for(const [mode,spec] of Object.entries(targets.modes)){
  const stats=report.results[mode],errors=[];
  if(!stats?.books){fail(`${mode}: ${stats?.failures?.join('; ')||'No fitted weights'}`);continue;}
  const data=await readFile(resolve(root,`candidate-${mode}.bin`)),raw=await readFile(resolve(root,`weights-${mode}.bin`)),activity=await readFile(resolve(root,`activity-${mode}.bin`));
  const n=stats.books,cost=MODES[mode].cost;
  if(n<targets.minCandidateBooks||data.length!==n*32||raw.length!==n*8||activity.length!==n*32||source.results.find(r=>r.mode===mode)?.validatedBooks!==n){fail(`${mode}: Row count / validation mismatch`);continue;}
  const x=new Float64Array(n),w=new Float64Array(n),activitySum=Array(8).fill(0);
  let sum=0n,numerator=0n,maxWeight=0n,profit=0,nonzero=0,confirmed=0,cap=0,moment2=0,natural=0,etl40=0,etl10k=0,retriggered=0,invoked=0,featureMass=0,maxRetriggers=0;
  const durations=new Map();
  const tails=[5000,10000,25000,50000,100000].map(t=>({t,sum:0}));
  const naturalGroups=[1,2,3].map(code=>({code,mass:0,return:0,profit:0,confirmed:0,values:[]}));
  for(let i=0;i<n;i++){
    const weight=raw.readBigUInt64LE(i*8),payout=data.readUInt32LE(i*32),base=data.readUInt32LE(i*32+4),code=data.readUInt32LE(i*32+8),c=data.readUInt32LE(i*32+12),isCap=data.readUInt32LE(i*32+16);
    if(weight<=0n||weight>=2n**48n||payout>targets.maxWin*100||base>payout||code>3||isCap!==Number(payout===targets.maxWin*100))throw Error(`${mode} invalid row ${i}`);
    sum+=weight;numerator+=weight*BigInt(payout);if(weight>maxWeight)maxWeight=weight;
    const v=payout/100,q=Number(weight);x[i]=v;w[i]=q;profit+=q*(v>cost);nonzero+=q*(v>0);confirmed+=q*(c>0);cap+=q*isCap;moment2+=q*(v/cost)**2;
    etl40+=q*(v>40*cost?v/cost:0);etl10k+=q*(v>10000?v/cost:0);
    for(const t of tails)if(v>=t.t)t.sum+=q;
    if(code){natural+=q;const group=naturalGroups[code-1],award=(payout-base)/100,price=[100,200,500][code-1];group.mass+=q;group.return+=q*award;group.profit+=q*(award>price);group.confirmed+=q*(c>0);group.values.push([award,q]);}
    const a=Array.from({length:8},(_,k)=>activity.readUInt32LE(i*32+k*4));
    if(a[0]!==data.readUInt32LE(i*32+24)||a[1]!==data.readUInt32LE(i*32+28)||a[2]!==a[3]+a[4]+a[5]||a[4]>a[6]||a[7]>a[0])throw Error(`${mode} activity accounting ${i}`);
    a.forEach((v,k)=>activitySum[k]+=v*q);retriggered+=q*(a[1]>0);invoked+=q*(a[2]>0);maxRetriggers=Math.max(maxRetriggers,a[1]);
    if(a[7]){featureMass+=q;durations.set(a[7],(durations.get(a[7])||0)+q);}
  }
  const denominator=sum*BigInt(Math.round(cost*100)),total=Number(sum),rtp=Number(numerator)/Number(denominator);
  if(numerator*1000n<denominator*960n||numerator*1000n>denominator*967n)errors.push('Exact RTP outside Stake Engine’s 96.0%–96.7% range');
  const fractionScale=100000000n,target=BigInt(Math.round(targets.rtp*Number(fractionScale))),tolerance=BigInt(Math.round(targets.rtpTolerance*Number(fractionScale)));
  const difference=numerator*fractionScale-denominator*target;
  if((difference<0n?-difference:difference)>denominator*tolerance)errors.push('Exact RTP outside tolerance');
  if(sum>=2n**48n||String(sum)!==stats.weightSum||String(numerator)!==stats.exactRtpNumerator||String(denominator)!==stats.exactRtpDenominator)errors.push('Exact integer totals mismatch');
  const order=Uint32Array.from({length:n},(_,i)=>i);order.sort((a,b)=>x[a]-x[b]);
  let mass=0,median=0;for(const i of order){mass+=w[i];if(mass>=total*.5){median=x[i];break;}}
  let left=total*.001,tail=0;for(let j=n-1;j>=0&&left>0;j--){const i=order[j],take=Math.min(left,w[i]);tail+=take*x[i];left-=take;}
  const stdDev=Math.sqrt(moment2/total-rtp**2),cvar=tail/(total*.001),numbers={profit:profit/total,nonzero:nonzero/total,confirmed:confirmed/total};
  for(const key of ['profit','nonzero','confirmed'])if(spec[key]&&(numbers[key]<spec[key][0]-1e-6||numbers[key]>spec[key][1]+1e-6))errors.push(key);
  if(spec.median&&(median/cost<spec.median[0]||median/cost>spec.median[1]))errors.push('Median');
  if(cap/total<targets.minimumCapProbability*.99||Number(maxWeight)/total>targets.maximumSingleBookProbability)errors.push('Cap frequency / concentration');
  if(stdDev>50||(cost===1&&stdDev<.6))errors.push('Volatility');
  if(mode==='god'&&stdDev+1e-5<1.05*Math.max(audit.results.lesser?.stdDev||Infinity,audit.results.blood?.stdDev||Infinity))errors.push('God volatility floor');
  if(cvar>20000.01||cvar/cost>700.001)errors.push('CVaR');
  tails.forEach((t,k)=>{if(t.sum/total>[.01,.005,.002,.001,.0005][k]+1e-7)errors.push(`Tail ${t.t}`);});
  if(etl40/total>.8*targets.rtp+1e-6||etl10k/total>.6*targets.rtp+1e-6||(etl40+etl10k)/total>1.3*targets.rtp+1e-6||(etl40+etl10k)*cost/total>3000.01)errors.push('Expected tail loss');
  if(cost<=3){
    if(numbers.nonzero<.05||natural/total<previousNatural*(mode==='base'?0:1.05)-1e-7)errors.push('Natural frequency / hit rate');previousNatural=natural/total;
    for(const [i,g] of naturalGroups.entries()){
      if(!g.mass)continue;const price=[100,200,500][i],s=targets.modes[['lesser','blood','greater'][i]];
      if(g.return/g.mass/price<.9349||g.return/g.mass/price>.9951)errors.push('Natural return');
      for(const k of ['profit','confirmed'])if(g[k]/g.mass<s[k][0]-1e-5||g[k]/g.mass>s[k][1]+1e-5)errors.push(`Natural ${i} ${k}`);
      g.values.sort((a,b)=>a[0]-b[0]);let seen=0,m=0;for(const [v,q] of g.values){seen+=q;if(seen>=g.mass*.5){m=v;break;}}
      if(m/price<s.median[0]-1e-5||m/price>s.median[1]+1e-5)errors.push(`Natural ${i} median`);
    }
  }
  const names=['spins','retriggers','invocations','firstChanceConfirmed','secondChanceConfirmed','expired','deferred','featureSpins'];
  names.forEach((name,i)=>{if(Math.abs(activitySum[i]/total-stats.activity[name])>1e-7)errors.push(`Activity ${name}`);});
  if(Math.abs(retriggered/total-stats.activity.retriggerProbability)>1e-7)errors.push('Retrigger probability');
  let durationMass=0,duration95=0;for(const [spins,weight] of [...durations].sort((a,b)=>a[0]-b[0])){durationMass+=weight;if(durationMass>=featureMass*.95){duration95=spins;break;}}
  Object.assign(stats.activity,{invocationProbability:invoked/total,firstChanceSuccessRate:activitySum[2]?activitySum[3]/activitySum[2]:null,meanFeatureDurationWhenTriggered:featureMass?activitySum[7]/featureMass:0,featureDurationP95:duration95,maximumObservedRetriggers:maxRetriggers});
  if(stats.cost!==cost||stats.failures.length)errors.push('Calibration gate');
  Object.assign(stats,{weightsSha256:hash(raw),candidatesSha256:hash(data),activitySha256:hash(activity)});
  audit.results[mode]={books:n,weightsChecked:n,rtp,exactRtpNumerator:String(numerator),exactRtpDenominator:String(denominator),stdDev,median,...numbers,cvar999BaseBets:cvar,failures:errors};
  errors.forEach(e=>fail(`${mode}: ${e}`));console.log(JSON.stringify({mode,books:n,rtp,failures:errors}));
}
audit.passed=audit.failures.length===0&&Object.keys(audit.results).length===7;
report.ready=audit.passed;report.auditPassed=audit.passed;
const reportBytes=Buffer.from(JSON.stringify(report,null,2));audit.reportSha256=hash(reportBytes);
await writeFile(resolve(root,'calibration-report.json'),reportBytes);
await writeFile(resolve(root,'audit-report.json'),JSON.stringify(audit,null,2));
console.log(JSON.stringify({passed:audit.passed,failures:audit.failures}));if(!audit.passed)process.exitCode=2;
