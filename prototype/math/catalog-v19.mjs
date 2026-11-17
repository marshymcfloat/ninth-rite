import {readFile} from 'node:fs/promises';
import {createHash,randomInt} from 'node:crypto';
import {resolve} from 'node:path';
import {catalogBook} from './catalog-v19-generator.mjs';
import {validateBook} from './validate-v19-book.mjs';
import {MODES,RULES_VERSION} from '../rules-v19.mjs';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function loadCandidateCatalog(directory){
  const root=resolve(directory);let reportBytes;
  try{reportBytes=await readFile(resolve(root,'calibration-report.json'));}catch(e){if(e.code==='ENOENT')return null;throw e;}
  const report=JSON.parse(reportBytes);
  if(!report.ready)return null;
  let verification;
  try{verification=JSON.parse(await readFile(resolve(root,'verification-report.json'),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(!verification.passed||verification.rulesVersion!==RULES_VERSION||!verification.browser?.length)return null;
  for(const name of ['server.mjs','public/local-session.mjs','public/style-2/scene.mjs','public/style-2/playback.mjs','public/style-2/game-view.mjs','public/style-2/intervention.mjs']){
    if(hash(await readFile(new URL('../'+name,import.meta.url)))!==verification.fingerprints?.[name])return null;
  }
  const audit=JSON.parse(await readFile(resolve(root,'audit-report.json'),'utf8'));
  if(!audit.passed||audit.rulesVersion!==RULES_VERSION||audit.reportSha256!==hash(reportBytes)||!report.source.allBooksValidated||report.source.validatedBooks<7000000)throw Error('Candidate catalog requires a complete independent audit.');
  for(const name of ['engine.mjs','config.mjs','engine-v19.mjs','rules-v19.mjs','math/catalog-v19-generator.mjs','math/validate-v19-book.mjs']){
    if(hash(await readFile(new URL('../'+name,import.meta.url)))!==report.source.fingerprints[name])throw Error(`Candidate source changed: ${name}`);
  }
  if(hash(await readFile(new URL('./targets-v19.json',import.meta.url)))!==audit.targetsSha256)throw Error('Candidate targets changed; recalibrate before use');
  const modes=new Map();
  for(const mode of Object.keys(MODES).filter(id=>!MODES[id].disabled)){
    const stats=report.results[mode];
    if(!stats||stats.failures.length||stats.books<1000000||stats.cost!==MODES[mode].cost)throw Error('Candidate mode gate failed');
    const weights=await readFile(resolve(root,`weights-${mode}.bin`)),outcomes=await readFile(resolve(root,`candidate-${mode}.bin`)),activity=await readFile(resolve(root,`activity-${mode}.bin`));
    if(hash(weights)!==stats.weightsSha256||hash(outcomes)!==stats.candidatesSha256||hash(activity)!==stats.activitySha256)throw Error('Candidate file fingerprint mismatch');
    if(weights.length!==stats.books*8||outcomes.length!==stats.books*32||activity.length!==stats.books*32)throw Error('Candidate row count mismatch');
    const cumulative=new Float64Array(stats.books),payouts=new Uint32Array(stats.books);let total=0;
    for(let i=0;i<stats.books;i++){
      const w=Number(weights.readBigUInt64LE(i*8));if(!Number.isSafeInteger(w)||w<=0)throw Error('Invalid candidate weight');
      total+=w;if(!Number.isSafeInteger(total)||total>=2**48)throw Error('Candidate weight overflow');
      cumulative[i]=total;payouts[i]=outcomes.readUInt32LE(i*32);
    }
    if(String(total)!==stats.weightSum)throw Error('Candidate weight sum mismatch');
    modes.set(mode,{cumulative,payouts,total});
  }
  function get(mode,index){
    const entry=modes.get(mode);if(!entry||!Number.isInteger(index)||index<0||index>=entry.payouts.length)throw Error('Unknown candidate book');
    const book=catalogBook(mode,index);validateBook(book);
    if(book.totalHundredths!==entry.payouts[index])throw Error('Candidate payout changed');
    return {...book,id:index+1,catalogVersion:report.version,modelStatus:`FIXED OUTCOME CATALOG — ${(report.targetRtp*100).toFixed(2)}% RTP candidate`};
  }
  return {report,get,sample(mode,choose=randomInt){
    const entry=modes.get(mode);if(!entry)throw Error('Unknown candidate mode');
    const ticket=choose(entry.total);if(!Number.isSafeInteger(ticket)||ticket<0||ticket>=entry.total)throw Error('Invalid candidate ticket');
    let lo=0,hi=entry.cumulative.length-1;while(lo<hi){const mid=(lo+hi)>>>1;if(entry.cumulative[mid]>ticket)hi=mid;else lo=mid+1;}return get(mode,lo);
  }};
}
