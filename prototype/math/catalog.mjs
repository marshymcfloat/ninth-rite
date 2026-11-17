import { readFile } from 'node:fs/promises';
import { createHash, randomInt } from 'node:crypto';
import { resolve } from 'node:path';
import { catalogBook } from './catalog-generator.mjs';
import { validateBook } from './validate-book.mjs';

export async function loadCatalog(directory) {
  const root=resolve(directory),report=JSON.parse(await readFile(resolve(root,'calibration-report.json'),'utf8'));
  if(!report.ready)throw Error('Catalog has not passed all calibration gates');
  for(const [name,expected] of Object.entries(report.source.fingerprints)){
    const actual=createHash('sha256').update(await readFile(new URL('../'+name,import.meta.url))).digest('hex');
    if(actual!==expected)throw Error(`Catalog source changed: ${name}. Regenerate before playing.`);
  }
  const modes=new Map();
  for(const [mode,stats] of Object.entries(report.results)){
    const raw=await readFile(resolve(root,`weights-${mode}.bin`)), outcomes=await readFile(resolve(root,`candidate-${mode}.bin`));
    if(createHash('sha256').update(raw).digest('hex')!==stats.weightsSha256||createHash('sha256').update(outcomes).digest('hex')!==stats.candidatesSha256)throw Error('Catalog file hash mismatch; run the catalog audit before release validation');
    if(raw.length!==stats.books*8||outcomes.length!==stats.books*32)throw Error('Catalog row count mismatch');
    const cumulative=new Float64Array(stats.books),payouts=new Uint32Array(stats.books);let total=0;
    for(let i=0;i<stats.books;i++){
      const weight=Number(raw.readBigUInt64LE(i*8));if(!Number.isSafeInteger(weight)||weight<0)throw Error('Invalid catalog weight');
      total+=weight;if(!Number.isSafeInteger(total)||total>=2**48)throw Error('Catalog weight range exceeds local sampler');
      cumulative[i]=total;payouts[i]=outcomes.readUInt32LE(i*32);
    }
    if(total<=0)throw Error('Empty catalog');modes.set(mode,{cumulative,total,payouts,stats});
  }
  function get(mode,index,{validate=true}={}){
    const entry=modes.get(mode);if(!entry||!Number.isInteger(index)||index<0||index>=entry.payouts.length)throw Error('Unknown catalog round');
    const book=catalogBook(mode,index);if(book.totalHundredths!==entry.payouts[index])throw Error('Regenerated catalog payout mismatch');
    if(validate)validateBook(book);return {...book,id:index+1,catalogVersion:report.version};
  }
  return {report,get,sample(mode,choose=randomInt){
    const entry=modes.get(mode);if(!entry)throw Error('Unknown catalog mode');
    const ticket=choose(entry.total);if(!Number.isSafeInteger(ticket)||ticket<0||ticket>=entry.total)throw Error('Invalid selection ticket');
    let lo=0,hi=entry.cumulative.length-1;while(lo<hi){const mid=(lo+hi)>>>1;if(entry.cumulative[mid]>ticket)hi=mid;else lo=mid+1;}
    return get(mode,lo);
  }};
}
