import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
import {estimate} from './export-catalog.mjs';
import {loadCatalog} from '../math/catalog.mjs';
const source=resolve(process.env.NINTH_MATH_DIR||'../work/ninth-math'),target=resolve(process.argv[2]||'../release/ninth-rite-math-v1.7.0');
const catalog=await loadCatalog(source),size=await estimate();
if(!size.storageGate)throw Error('Storage gate failed');
await mkdir(target,{recursive:false});
await writeFile(resolve(target,'export-plan.json'),JSON.stringify({version:catalog.report.version,source:catalog.report.source.fingerprints,size},null,2));
const queue=['blood','greater','lesser','ante_30','ante_15','base','god'];
async function worker(){
  while(queue.length){const mode=queue.shift();await new Promise((done,fail)=>{
    const child=spawn(process.execPath,['scripts/export-catalog.mjs',target,`--worker=${mode}`],{stdio:['ignore','inherit','inherit'],windowsHide:true});
    child.on('error',fail);child.on('exit',code=>code===0?done():fail(Error(`Export failed for ${mode}: ${code}`)));
  });}
}
const results=await Promise.allSettled(Array.from({length:4},worker));
if(results.some(r=>r.status==='rejected'))throw Error(results.filter(r=>r.status==='rejected').map(r=>r.reason.message).join('; '));
const index={modes:[]},manifest={version:catalog.report.version,source:catalog.report.source.fingerprints,files:{},validatedBooks:0,completedAt:new Date().toISOString()};
for(const mode of Object.keys(catalog.report.results)){
  const part=JSON.parse(await readFile(resolve(target,`index-${mode}.json`),'utf8')),check=JSON.parse(await readFile(resolve(target,`validation-${mode}.json`),'utf8'));
  if(check.validatedBooks!==catalog.report.results[mode].books)throw Error('Incomplete exported mode');
  index.modes.push(...part.modes);Object.assign(manifest.files,check.files);manifest.validatedBooks+=check.validatedBooks;
}
await writeFile(resolve(target,'validation-manifest.json'),JSON.stringify(manifest,null,2));
await writeFile(resolve(target,'index.json'),JSON.stringify(index,null,2));
console.log(JSON.stringify({complete:true,target,validatedBooks:manifest.validatedBooks}));
