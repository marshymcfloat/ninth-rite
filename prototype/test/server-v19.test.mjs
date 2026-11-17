import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {makeServer} from '../server.mjs';
import {validateBook} from '../math/validate-v19-book.mjs';
test('candidate pricing, request terms, duplicate purchase and original configuration stay isolated',async t=>{
  const server=makeServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const post=async(path,payload)=>{const r=await fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});return {status:r.status,data:await r.json()};};
  const config=await (await fetch(origin+'/api/config?rulesVersion=rite-v1.9')).json();
  assert.equal(config.modes.god.cost,1000);assert.equal(config.modes.lesser.tier,16);assert.equal(config.modes.blood.tier,32);assert.equal(config.modes.greater.tier,64);assert.equal(config.catalog,null);
  const original=await (await fetch(origin+'/api/config')).json();assert.equal(original.modes.lesser.tier,8);assert.equal(original.rulesVersion,'1.7');
  const {sessionId}= (await post('/api/session',{})).data;
  const request={sessionId,requestId:randomUUID(),rulesVersion:'rite-v1.9',mode:'god',bet:.5,unitCost:1000,price:500};
  const [a,b]=await Promise.all([post('/api/play',request),post('/api/play',request)]);
  assert.equal(a.status,200);assert.deepEqual(a,b);assert.equal(a.data.round.cost,500);validateBook(a.data.round);
  for(const change of [{price:50},{unitCost:100},{rulesVersion:'repeat-retriggers-v1'},{bet:1},{mode:'blood'}])assert.equal((await post('/api/play',{...request,...change})).status,409);
  assert.equal((await post('/api/play',{...request,requestId:randomUUID(),price:100})).status,400);
  const after=await (await fetch(origin+`/api/session?id=${sessionId}`)).json();assert.equal(after.balance,a.data.balance);assert.equal(after.lastRound.id,a.data.round.id);
  for(const name of ['deferred_confirm','deferred_expire','final_expire','retrigger']){
    const demo=await post('/api/scenario',{sessionId,rulesVersion:'rite-v1.9',scenario:name});assert.equal(demo.status,200);validateBook(demo.data.round);assert.equal(demo.data.balance,after.balance);
  }
  assert.deepEqual(config.allowedBets.slice(0,4),[.01,.02,.05,.1]);
  const small=await post('/api/play',{...request,requestId:randomUUID(),mode:'ante_15',bet:.01,unitCost:1.5,price:.015});
  assert.equal(small.status,200);
  assert.equal(small.data.round.cost,.015);
  const payoutUnits=small.data.round.totalHundredths*100;
  assert.equal(Math.round(small.data.round.payout*1e6),payoutUnits);
  assert.equal(Math.round(small.data.balance*1e6),Math.round(after.balance*1e6)-15000+payoutUnits);
});
