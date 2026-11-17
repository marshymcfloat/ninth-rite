import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {mkdir,open,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {catalogBook} from '../math/catalog-v19-generator.mjs';
import {validateBook} from '../math/validate-v19-book.mjs';
import {summarizeBook} from '../math/catalog-generator.mjs';
import {RULES,MODES} from '../rules-v19.mjs';
import {TEST_MATH} from '../config.mjs';
if(isMainThread){
  const count=Number(process.argv[2]||100000),folder=resolve(process.argv[3]||'../work/ninth-math-v19-feasibility');
  if(!Number.isSafeInteger(count)||count<10000)throw Error('At least 10000 books per mode required');
  await mkdir(folder,{recursive:true});
  const fingerprints={};for(const name of ['engine.mjs','config.mjs','engine-v19.mjs','rules-v19.mjs','math/catalog-v19-generator.mjs','math/validate-v19-book.mjs'])fingerprints[name]=createHash('sha256').update(await readFile(new URL('../'+name,import.meta.url))).digest('hex');
  const only=process.argv[4];let prior=null;
  if(only){
    if(!MODES[only])throw Error('Unknown extension mode');
    prior=JSON.parse(await readFile(resolve(folder,'candidate-report.json'),'utf8'));
    if(!prior.allBooksValidated||JSON.stringify(prior.fingerprints)!==JSON.stringify(fingerprints))throw Error('Existing candidate must be validated with identical source before extension');
  }
  const report={...(prior||{}),version:'1.9.0',kind:'candidate',count:prior?Math.min(prior.count,count):count,rules:RULES,math:TEST_MATH,fingerprints,results:prior?prior.results.filter(r=>r.mode!==only):[],allBooksValidated:false};
  await writeFile(resolve(folder,'candidate-report.json'),JSON.stringify(report,null,2));
  const modes=only?[only]:['greater','blood','lesser','base','ante_15','ante_30','god'];let next=0;
  await Promise.all(Array.from({length:Math.min(6,modes.length)},async()=>{
    while(next<modes.length){const mode=modes[next++];const result=await new Promise((accept,reject)=>{
      const worker=new Worker(new URL(import.meta.url),{workerData:{mode,count,folder}});let result;
      worker.on('message',message=>{if(message.done)result=message;else console.log(JSON.stringify(message));});
      worker.on('error',reject);worker.on('exit',code=>code||!result?reject(Error(`Worker ${mode} failed (${code})`)):accept(result));
    });report.results.push(result);console.log(JSON.stringify(result));}
  }));
  report.allBooksValidated=true;report.validatedBooks=report.results.reduce((sum,r)=>sum+r.validatedBooks,0);
  await writeFile(resolve(folder,'candidate-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({complete:true,folder,validatedBooks:report.validatedBooks}));
}else{
  const {mode,count,folder}=workerData,records=await open(resolve(folder,`candidate-${mode}.bin`),'w'),activity=await open(resolve(folder,`activity-${mode}.bin`),'w');
  const rows=Buffer.alloc(32000),extra=Buffer.alloc(32000),started=performance.now();let total=0,retriggers=0,first=0,second=0,spins=0;
  try{for(let index=0;index<count;index++){
    const book=catalogBook(mode,index);validateBook(book);const s=summarizeBook(book),offset=index%1000*32;
    [s.payout,s.base,s.natural,s.confirmed,s.cap,s.clusters,s.spins,book.retriggerCount].forEach((n,k)=>rows.writeUInt32LE(n,offset+k*4));
    const countEvent=(type,chance)=>book.events.filter(e=>e.type===type&&(chance===undefined||e.chance===chance)).length;
    const a=[book.spins,book.retriggerCount,countEvent('interventionPending'),countEvent('interventionConfirmed',1),countEvent('interventionConfirmed',2),countEvent('interventionExpired'),countEvent('interventionDeferred'),book.events.filter(e=>e.type==='spinStart'&&e.feature).length];
    a.forEach((n,k)=>extra.writeUInt32LE(n,offset+k*4));total+=s.payout;spins+=book.spins;retriggers+=book.retriggerCount;first+=a[3];second+=a[4];
    if(index%1000===999||index===count-1){await records.write(rows.subarray(0,(index%1000+1)*32));await activity.write(extra.subarray(0,(index%1000+1)*32));}
    if((index+1)%100000===0)parentPort.postMessage({mode,validated:index+1,count,seconds:Math.round((performance.now()-started)/1000)});
  }}finally{await records.close();await activity.close();}
  parentPort.postMessage({done:true,mode,validatedBooks:count,observedRtp:total/count/100/MODES[mode].cost,meanSpins:spins/count,retriggers,first,second,seconds:(performance.now()-started)/1000});
}
