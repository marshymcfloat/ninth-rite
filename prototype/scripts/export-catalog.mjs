import {mkdir,readFile,writeFile,statfs,stat} from 'node:fs/promises';
import {createWriteStream,createReadStream} from 'node:fs';
import {createZstdCompress,zstdCompressSync} from 'node:zlib';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {MODES} from '../config.mjs';
import {catalogBook} from '../math/catalog-generator.mjs';
import {validateBook} from '../math/validate-book.mjs';
import {loadCatalog} from '../math/catalog.mjs';
const source=resolve(process.env.NINTH_MATH_DIR||'../work/ninth-math');
const modes=Object.keys(MODES).filter(k=>!MODES[k].disabled);
export function uploadRow(book,id){
  validateBook(book);
  const events=book.events.map((event,index)=>({...event,index,...(index===0?{bookVersion:book.version,gdd:book.gdd,mathId:book.mathId,rules:book.rules}: {})}));
  const line=JSON.stringify({id,events,payoutMultiplier:book.totalHundredths})+'\n';
  if(Buffer.byteLength(line)>1048576)throw Error(`Book ${id} exceeds 1 MiB`);
  return line;
}
export async function estimate(){
  const estimates={measuredAt:new Date().toISOString(),samplePerMode:500,assumedBooksPerMode:1000000,modes:{}};
  for(const mode of modes){
    const rows=Array.from({length:500},(_,i)=>uploadRow(catalogBook(mode,i?i*1999:0),i+1));
    const size=zstdCompressSync(Buffer.from(rows.join(''))).length;
    estimates.modes[mode]={sampleCompressedBytes:size,estimatedCompressedBytes:Math.ceil(size/500*1000000),estimatedCsvBytes:35000000,maxSampleBookBytes:Math.max(...rows.map(x=>Buffer.byteLength(x)))};
  }
  estimates.estimatedBytes=Object.values(estimates.modes).reduce((s,x)=>s+x.estimatedCompressedBytes+x.estimatedCsvBytes,0);
  estimates.requiredBytesWithReserve=Math.ceil(estimates.estimatedBytes*1.3+300e6);
  const disk=await statfs(source);estimates.freeBytes=disk.bavail*disk.bsize;
  estimates.storageGate=estimates.freeBytes>=estimates.requiredBytesWithReserve;
  await writeFile(resolve(source,'storage-estimate.json'),JSON.stringify(estimates,null,2));return estimates;
}
async function main(){
  const worker=process.argv.find(x=>x.startsWith('--worker='))?.slice(9);
  if(worker&&!modes.includes(worker))throw Error('Unknown export mode');
  const size=worker?null:await estimate();if(size)console.log(JSON.stringify(size));if(process.argv.includes('--estimate'))return;
  const catalog=await loadCatalog(source);
  if(size&&!size.storageGate)throw Error('Full export needs more free space. See storage-estimate.json; existing files were preserved.');
  const target=resolve(process.argv[2]||'../release/ninth-rite/math');
  if(worker){const plan=JSON.parse(await readFile(resolve(target,'export-plan.json'),'utf8'));if(plan.version!==catalog.report.version||JSON.stringify(plan.source)!==JSON.stringify(catalog.report.source.fingerprints))throw Error('Export workspace differs from catalog');}
  else await mkdir(target,{recursive:false});
  const index={modes:[]},manifest={version:catalog.report.version,source:catalog.report.source.fingerprints,files:{},validatedBooks:0};
  for(const mode of worker?[worker]:modes){
    const raw=await readFile(resolve(source,`weights-${mode}.bin`)),stats=catalog.report.results[mode];
    const events=`books_${mode}.jsonl.zst`,weights=`lookUpTable_${mode}_0.csv`,csv=createWriteStream(resolve(target,weights),{flags:'wx'});
    let totalWeight=0n,csvError;const hash=createHash('sha256');csv.on('error',error=>{csvError=error;});
    async function* rows(){
      for(let i=0;i<stats.books;i++){
        if(csvError)throw csvError;
        if(i%10000===0){const disk=await statfs(target);if(disk.bavail*disk.bsize<300e6)throw Error('Export stopped with 300 MB reserved; partial files retained.');}
        const book=catalog.get(mode,i,{validate:false}),weight=raw.readBigUInt64LE(i*8);totalWeight+=weight;
        if(totalWeight>18446744073709551615n)throw Error('Weight total exceeds uint64');
        const line=`${i+1},${weight},${book.totalHundredths}\n`;hash.update(line);
        if(!csv.write(line))await once(csv,'drain');
        yield uploadRow(book,i+1);manifest.validatedBooks++;
        if((i+1)%100000===0)console.log(`${mode}: ${i+1}/${stats.books} validated and streamed`);
      }
    }
    try{await pipeline(Readable.from(rows()),createZstdCompress(),createWriteStream(resolve(target,events),{flags:'wx'}));}
    finally{await new Promise((res,rej)=>csv.end(error=>error?rej(error):res()));}
    const bytes=(await stat(resolve(target,events))).size;if(bytes>=4*1024**3)throw Error(`${mode} exceeds the compressed per-file limit`);
    const eventHash=createHash('sha256');for await(const chunk of createReadStream(resolve(target,events)))eventHash.update(chunk);
    manifest.files[events]={bytes,sha256:eventHash.digest('hex')};manifest.files[weights]={sha256:hash.digest('hex'),totalWeight:String(totalWeight),rows:stats.books};
    index.modes.push({name:mode,cost:stats.cost,events,weights});console.log(`${mode}: exported and validated ${stats.books} books`);
  }
  await writeFile(resolve(target,worker?`index-${worker}.json`:'index.json'),JSON.stringify(index,null,2));
  await writeFile(resolve(target,worker?`validation-${worker}.json`:'validation-manifest.json'),JSON.stringify(manifest,null,2));
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/export-catalog.mjs'))await main();
