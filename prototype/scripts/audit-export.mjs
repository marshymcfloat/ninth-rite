import {createReadStream} from 'node:fs';
import {readFile,writeFile,stat} from 'node:fs/promises';
import {createZstdDecompress} from 'node:zlib';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(process.argv[2]||'../release/ninth-rite-math-v1.7.0');
const report=JSON.parse(await readFile(resolve('../work/ninth-math/calibration-report.json'),'utf8'));
async function* lines(stream){
  let pending='';stream.setEncoding('utf8');
  for await(const chunk of stream){
    pending+=chunk;let start=0,end;
    while((end=pending.indexOf('\n',start))!==-1){yield pending.slice(start,end);start=end+1;}
    pending=pending.slice(start);if(pending.length>1048576)throw Error('Oversized line');
  }
  if(pending)throw Error('Missing terminal newline');
}
async function hashFile(path){const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk);return hash.digest('hex');}
async function audit(mode){
  const descriptor=JSON.parse(await readFile(resolve(root,`index-${mode}.json`),'utf8')).modes[0];
  const manifest=JSON.parse(await readFile(resolve(root,`validation-${mode}.json`),'utf8'));
  const expected=report.results[mode];
  if(descriptor.name!==mode||descriptor.cost!==expected.cost||manifest.version!==report.version)throw Error('Wrong mode/version metadata');
  const events=resolve(root,descriptor.events),weights=resolve(root,descriptor.weights);
  if((await stat(events)).size>=4*1024**3)throw Error('Compressed file too large');
  for(const [name,path] of [[descriptor.events,events],[descriptor.weights,weights]])if(await hashFile(path)!==manifest.files[name].sha256)throw Error('Output checksum mismatch');
  if(process.argv.includes('--reuse-verified')){
    try{
      const prior=JSON.parse(await readFile(resolve(root,`contract-audit-${mode}.json`),'utf8'));
      const completed=Date.parse(prior.checkedAt),latest=Math.max((await stat(events)).mtimeMs,(await stat(weights)).mtimeMs);
      if(prior.mode===mode&&prior.rows===expected.books&&prior.allRowsAndRecordedTotalsMatched&&prior.hashesVerified&&completed>=latest&&prior.exactRtpNumerator===expected.exactRtpNumerator&&prior.exactRtpDenominator===expected.exactRtpDenominator){console.log(`${mode}: reused complete row audit after rechecking both file hashes`);return prior;}
    }catch(error){if(error.code!=='ENOENT')throw error;}
  }
  if(process.argv.includes('--lookup-only')){
    const candidates=await readFile(resolve(`../work/ninth-math/candidate-${mode}.bin`)),fixedWeights=await readFile(resolve(`../work/ninth-math/weights-${mode}.bin`));
    if(createHash('sha256').update(candidates).digest('hex')!==expected.candidatesSha256||createHash('sha256').update(fixedWeights).digest('hex')!==expected.weightsSha256)throw Error('Source catalog checksum mismatch');
    let rows=0,totalWeight=0n,numerator=0n,positive=0;
    for await(const line of lines(createReadStream(weights))){
      if(!/^\d+,\d+,\d+$/.test(line))throw Error('Invalid lookup row');
      const [id,weight,payout]=line.split(',').map(BigInt);
      if(id!==BigInt(rows+1)||payout!==BigInt(candidates.readUInt32LE(rows*32))||weight!==fixedWeights.readBigUInt64LE(rows*8))throw Error(`Lookup differs from fixed catalog: ${mode} ${rows+1}`);
      rows++;totalWeight+=weight;numerator+=weight*payout;positive+=weight>0n;
    }
    const denominator=totalWeight*BigInt(Math.round(descriptor.cost*100));
    if(rows!==expected.books||manifest.validatedBooks!==rows||String(numerator)!==expected.exactRtpNumerator||String(denominator)!==expected.exactRtpDenominator||String(totalWeight)!==expected.weightSum)throw Error('Published rows/weights disagree with calibration');
    const result={mode,rows,positiveWeightBooks:positive,exactRtpNumerator:String(numerator),exactRtpDenominator:String(denominator),rtp:Number(numerator)/Number(denominator),hashesVerified:true,allLookupRowsMatchCatalog:true,allBooksValidatedDuringExport:true,compressedFilesMatchValidatedExport:true,roundtripBookAudit:false,checkedAt:new Date().toISOString()};
    await writeFile(resolve(root,`contract-audit-${mode}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result));return result;
  }
  const compressed=createReadStream(events),decoded=createZstdDecompress();compressed.on('error',e=>decoded.destroy(e));compressed.pipe(decoded);
  const lookup=lines(createReadStream(weights))[Symbol.asyncIterator]();
  let rows=0,totalWeight=0n,numerator=0n,positive=0,maxBookBytes=0;
  for await(const line of lines(decoded)){
    const next=await lookup.next();if(next.done)throw Error('More books than lookup rows');
    if(!/^\d+,\d+,\d+$/.test(next.value))throw Error('Invalid lookup row');
    const [id,weight,payout]=next.value.split(',').map(BigInt),book=JSON.parse(line);rows++;
    if(id!==BigInt(rows)||book.id!==rows||BigInt(book.payoutMultiplier)!==payout)throw Error(`Row/order/payout mismatch: ${mode} ${rows}`);
    if(book.events.at(-1)?.type!=='roundEnd'||BigInt(book.events.at(-1).totalHundredths)!==payout)throw Error('Events disagree with published payout');
    if(book.events[0]?.bookVersion!==3||book.events[0]?.gdd!=='1.7')throw Error('Missing versioned event metadata');
    const bytes=Buffer.byteLength(line)+1;maxBookBytes=Math.max(maxBookBytes,bytes);if(bytes>1048576)throw Error('Book exceeds 1 MiB');
    totalWeight+=weight;numerator+=weight*payout;positive+=weight>0n;
  }
  if(!(await lookup.next()).done||rows!==expected.books||rows!==manifest.validatedBooks)throw Error('Wrong row count');
  const denominator=totalWeight*BigInt(Math.round(descriptor.cost*100));
  if(String(numerator)!==expected.exactRtpNumerator||String(denominator)!==expected.exactRtpDenominator||String(totalWeight)!==expected.weightSum)throw Error('Published weights disagree with calibrated RTP');
  if(totalWeight>18446744073709551615n)throw Error('Weight total exceeds uint64');
  const result={mode,rows,positiveWeightBooks:positive,maxBookBytes,exactRtpNumerator:String(numerator),exactRtpDenominator:String(denominator),rtp:Number(numerator)/Number(denominator),hashesVerified:true,allRowsAndRecordedTotalsMatched:true,checkedAt:new Date().toISOString()};
  await writeFile(resolve(root,`contract-audit-${mode}.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result));return result;
}
const mode=process.argv.find(x=>x.startsWith('--mode='))?.slice(7);
if(mode)await audit(mode);
else{
  const index=JSON.parse(await readFile(resolve(root,'index.json'),'utf8')),results={};
  if(index.modes.length!==7||new Set(index.modes.map(x=>x.name)).size!==7)throw Error('Expected seven unique modes');
  const queue=index.modes.map(x=>x.name);
  async function worker(){while(queue.length){const id=queue.shift();results[id]=await audit(id);}}
  await Promise.all([worker(),worker()]);
  await writeFile(resolve(root,'contract-audit.json'),JSON.stringify({passed:true,rows:Object.values(results).reduce((s,x)=>s+x.rows,0),version:report.version,modes:results},null,2));
}
