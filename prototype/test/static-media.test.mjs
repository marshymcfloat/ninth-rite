import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {serveVideo} from '../static-media.mjs';

test('video serving supports exact ranges, suffixes, HEAD and rejects invalid ranges',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'rite-media-'));
  const path=join(dir,'clip.webm');
  await writeFile(path,Buffer.from('0123456789'));
  const server=createServer((req,res)=>serveVideo(req,res,path,'video/webm'));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  try{
    let response=await fetch(url,{headers:{Range:'bytes=2-5'}});
    assert.equal(response.status,206);assert.equal(response.headers.get('content-range'),'bytes 2-5/10');assert.equal(await response.text(),'2345');
    response=await fetch(url,{headers:{Range:'bytes=-3'}});
    assert.equal(response.status,206);assert.equal(await response.text(),'789');
    response=await fetch(url,{method:'HEAD'});
    assert.equal(response.status,200);assert.equal(response.headers.get('content-length'),'10');assert.equal(response.headers.get('content-type'),'video/webm');assert.equal(await response.text(),'');
    for(const range of ['bytes=100-','bytes=5-2','bytes=0-1,4-5','bytes=-0']){
      response=await fetch(url,{headers:{Range:range}});
      assert.equal(response.status,416);assert.equal(response.headers.get('content-range'),'bytes */10');
    }
    response=await fetch(url);
    assert.equal(await response.text(),'0123456789');
  }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
