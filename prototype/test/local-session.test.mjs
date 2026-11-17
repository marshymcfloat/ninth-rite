import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {makeServer} from '../server.mjs';
import {createLocalSession} from '../public/local-session.mjs';
export function memoryStorage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
export function sharedLocks(){let held=false;return {async request(name,options,task){if(held)return task(null);held=true;try{return await task({name});}finally{held=false;}}};}
for(const rulesVersion of [undefined,'repeat-retriggers-v1','rite-v1.9'])test(`shared local client recovers the original wager and rules (${rulesVersion??'legacy'}) and prevents concurrent purchases`,async t=>{
  const server=makeServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`,storage=memoryStorage(),locks=sharedLocks();let lose=true,requests=[];
  const fetcher=async(path,opts)=>{const response=await fetch(origin+path,opts);if(path==='/api/play'){requests.push(JSON.parse(opts.body));if(lose){lose=false;await response.json();throw Error('Connection lost after settlement');}}return response;};
  const first=createLocalSession({storage,locks,fetcher,uuid:randomUUID,rulesVersion});
  const initial=await first.run(()=>first.init());
  await assert.rejects(first.run(()=>first.play({mode:'lesser',bet:1,unitCost:100,price:100})),/Connection lost/);
  assert.equal(first.pending().mode,'lesser');
  const reloaded=createLocalSession({storage,locks,fetcher,uuid:randomUUID});
  const recovered=await reloaded.run(()=>reloaded.play({mode:'god',bet:5}));
  assert.deepEqual(requests[0],requests[1]);assert.equal(recovered.round.mode,'lesser');assert.equal(recovered.round.bet,1);
  assert.equal(recovered.round.gdd,rulesVersion==='rite-v1.9'?'1.9':rulesVersion?'1.8':'1.7');
  if(rulesVersion==='rite-v1.9'){assert.equal(requests[0].unitCost,100);assert.equal(requests[0].price,100);assert.equal(recovered.round.events[0].state.tier,16);}
  assert.equal(recovered.balance,initial.balance-recovered.round.cost+recovered.round.payout);assert.equal(reloaded.pending(),null);
  let release;const holding=first.run(()=>new Promise(resolve=>{release=resolve;}));
  await assert.rejects(reloaded.run(()=>reloaded.play({mode:'base',bet:1})),/Another game tab/);release();await holding;
  const fresh=await reloaded.run(()=>reloaded.init());assert.equal(fresh.lastRound.id,recovered.round.id);
});
