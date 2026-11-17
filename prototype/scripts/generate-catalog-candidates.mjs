import { mkdir, open, writeFile, statfs, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { MODES, TEST_MATH, RULES } from '../config.mjs';
import { catalogBook, summarizeBook } from '../math/catalog-generator.mjs';
import { generateRound as baseline } from '../../work/v1.6-readiness-backup/engine.mjs';
import {RULES as BASELINE_RULES,TEST_MATH as BASELINE_MATH} from '../../work/v1.6-readiness-backup/config.mjs';

const kind=process.argv[2]||'baseline', count=Number(process.argv[3]||(kind==='baseline'?100000:1000000));
if(!['baseline','candidate'].includes(kind)||!Number.isSafeInteger(count)||count<1)throw Error('Expected baseline|candidate and positive count');
const folder=resolve(process.env.NINTH_MATH_DIR||'../work/ninth-math');await mkdir(folder,{recursive:true});
const selected=process.argv[4];
const modes=Object.keys(MODES).filter(m=>!MODES[m].disabled&&(!selected||m===selected)), report={kind,count,rules:kind==='baseline'?BASELINE_RULES:RULES,math:kind==='baseline'?BASELINE_MATH:TEST_MATH,results:[],fingerprints:{}};
for(const file of kind==='baseline'?['engine.mjs','config.mjs']:['engine.mjs','config.mjs','math/catalog-generator.mjs'])report.fingerprints[file]=createHash('sha256').update(await readFile(new URL((kind==='baseline'?'../../work/v1.6-readiness-backup/':'../')+file,import.meta.url))).digest('hex');
const started=performance.now();
for(const mode of modes){
  const disk=await statfs(folder);if(disk.bavail*disk.bsize< count*32+300e6)throw Error('Insufficient storage; leave at least 300 MB free');
  const file=await open(resolve(folder,`${kind}-${mode}.bin`),'w'), buffer=Buffer.alloc(32*1000), histogram=new Map(), endings={};
  let total=0,confirmed=0,expired=0,invoked=0,spins=0,clusters=0,boards=0,marks=0,naturals=0;
  try {
    for(let i=0;i<count;i++){
      const book=kind==='baseline'?baseline({mode,seed:`ninth-baseline:${mode}:${i}`}):catalogBook(mode,i);
      const s=summarizeBook(book), offset=(i%1000)*32;
      [s.payout,s.base,s.natural,s.confirmed,s.cap,s.clusters,s.spins,s.retrigger].forEach((n,k)=>buffer.writeUInt32LE(n,offset+k*4));
      histogram.set(s.payout,(histogram.get(s.payout)||0)+1);total+=s.payout;confirmed+=s.confirmed>0;
      expired+=book.interventionExpiredCount;invoked+=book.events.filter(e=>e.type==='interventionPending').length;
      spins+=s.spins;clusters+=s.clusters;boards+=s.boards;marks+=s.marks;naturals+=s.natural>0;
      endings[book.finalState.tier]=(endings[book.finalState.tier]||0)+1;
      if(i%1000===999||i===count-1)await file.write(buffer.subarray(0,(i%1000+1)*32));
      if((i+1)%100000===0)console.log(`${kind} ${mode}: ${i+1}/${count}`);
    }
  } finally {await file.close();}
  const sorted=[...histogram].sort((a,b)=>a[0]-b[0]);let cumulative=0,median=0;for(const [p,n] of sorted){cumulative+=n;if(cumulative>=count/2){median=p/100;break;}}
  const summary={mode,count,meanReturn:total/count/100,median,observedRtp:total/count/100/MODES[mode].cost,confirmedBonusRate:confirmed/count,invoked,expired,naturalRate:naturals/count,meanClusters:clusters/count,meanSpins:spins/count,marksPerBoard:marks/boards,endingTiers:endings};
  report.results.push(summary);report.elapsedSeconds=(performance.now()-started)/1000;
  await writeFile(resolve(folder,`${kind}${selected?'-'+selected:''}-report.json`),JSON.stringify(report,null,2));console.log(JSON.stringify(summary));
}
