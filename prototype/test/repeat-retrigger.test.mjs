import test from 'node:test';
import assert from 'node:assert/strict';
import {generateRound,RULES,REPEAT_RULES_VERSION} from '../repeat-engine.mjs';
import {generateRound as legacyRound,cell} from '../engine.mjs';
import {MODES,RULES as LEGACY_RULES} from '../config.mjs';
import {quietBoard,withCells,oneCluster} from '../scenarios.mjs';
import {validateBook} from '../math/validate-book.mjs';
import {initialPlayback,applyRecordedEvent,playRecordedBook} from '../public/style-2/playback.mjs';
import {makeServer} from '../server.mjs';

const scatterBoard=count=>withCells(quietBoard(),[0,5,12,17,24].slice(0,count),'S');

for(const mode of ['lesser','blood','greater'])for(const count of [3,4,5]){
  test(`${mode}: ${count} Scatters repeatedly award +5, including the final added spin`,()=>{
    const starting=MODES[mode].spins,awards=[1,starting+5,starting+10];
    const book=generateRound({mode,initialState:{tier:120,blood:2,offerings:4},boardSource:({spin})=>awards.includes(spin)?scatterBoard(count):quietBoard()});
    const events=book.events.filter(e=>e.type==='retrigger');
    assert.deepEqual(events.map(e=>e.spin),awards);
    assert.deepEqual(events.map(e=>e.retriggerCount),[1,2,3]);
    assert.equal(book.spins,starting+15);assert.equal(book.retriggerCount,3);assert.equal(book.totalHundredths,0);
    let state=initialPlayback({...book,bet:1,payout:0},{rules:RULES});
    for(const event of book.events){
      const before=state;state=applyRecordedEvent(state,event,{...book,bet:1,payout:0});
      if(event.type==='retrigger'){
        assert.equal(state.counter.remaining,before.counter.remaining+5);
        assert.deepEqual(event.state,{tier:120,blood:2,offerings:4,sealed:false});
        assert.equal(book.events[event.index-1].type,'board');
      }
    }
    assert.equal(state.counter.remaining,0);assert.equal(state.complete,true);
  });
}

test('natural bonuses can retrigger repeatedly; entry scatters do not count as a retrigger',()=>{
  const book=generateRound({mode:'base',boardSource:({spin})=>[1,2,16].includes(spin)?scatterBoard(3):quietBoard()});
  assert.equal(book.events.filter(e=>e.type==='naturalBonus').length,1);
  assert.deepEqual(book.events.filter(e=>e.type==='retrigger').map(e=>e.spin),[2,16]);
  assert.equal(book.spins,21);
});

test('refill scatters cannot award again within a spin; God Mode cannot retrigger',()=>{
  const book=generateRound({mode:'lesser',boardSource:({spin})=>spin===1?oneCluster():quietBoard(),refillSource:()=>cell('S')});
  assert.ok(book.events.some(e=>e.type==='board'&&!e.initial&&e.scatterCount>=3));
  assert.equal(book.retriggerCount,0);assert.equal(book.spins,10);
  const god=generateRound({mode:'god',boardSource:()=>scatterBoard(5)});
  assert.equal(god.retriggerCount,0);assert.equal(god.spins,1);
});

test('repeat candidate preserves payout and cap resolution, and skips/replays every recorded retrigger',async()=>{
  for(const mode of ['base','lesser','blood','greater','god']){
    const book=generateRound({mode,seed:'repeat-check-'+mode});
    // The old validator checks shared cascade math independently of the new spin rule.
    validateBook({...book,gdd:'1.7',events:book.events.map(e=>e.type==='roundStart'?{...e,rules:LEGACY_RULES}:e)});
  }
  const capped=generateRound({mode:'greater',boardSource:({spin})=>spin===1?scatterBoard(3):Array.from({length:5},()=>Array.from({length:6},()=>cell('P4'))),refillSource:()=>cell('P4')});
  assert.equal(capped.capReached,true);assert.equal(capped.totalHundredths,5000000);assert.equal(capped.spins,2);
  const book={...generateRound({mode:'lesser',boardSource:({spin})=>[1,15,20].includes(spin)?scatterBoard(3):quietBoard()}),bet:1,payout:0};
  for(const options of [{},{instant:true},{replay:true}]){
    let awards=0;const final=await playRecordedBook(book,{rules:RULES,initialBoard:quietBoard()},{event(e){if(e.type==='retrigger')awards++;}},options);
    assert.equal(awards,3);assert.equal(final.counter.remaining,0);assert.equal(final.complete,true);
  }
  const old=legacyRound({mode:'lesser',boardSource:()=>scatterBoard(3)});
  assert.equal(old.spins,15);assert.equal(old.events.filter(e=>e.type==='retrigger').length,1);
});

test('HTTP candidate is versioned, repeatable, recoverable, and keeps original catalog selection',async t=>{
  let catalogCalls=0;
  const catalog={report:{version:'existing',results:{}},sample(mode){catalogCalls++;return {...legacyRound({mode,boardSource:()=>quietBoard()}),id:7};}};
  const server=makeServer({catalog});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const post=async(path,payload)=>{const r=await fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});return {status:r.status,body:await r.json()};};
  const config=await(await fetch(origin+'/api/config?rulesVersion='+REPEAT_RULES_VERSION)).json();
  assert.equal(config.catalog,null);assert.equal(config.rules.repeatRetriggers,true);assert.match(config.modelStatus,/UNVALIDATED/);
  const session=(await post('/api/session',{})).body;
  const payload={sessionId:session.sessionId,requestId:'repeat-test-0001',mode:'lesser',bet:1,rulesVersion:REPEAT_RULES_VERSION};
  const played=await post('/api/play',payload);assert.equal(played.status,200);assert.equal(played.body.round.gdd,'1.8');assert.equal(catalogCalls,0);
  assert.deepEqual((await post('/api/play',payload)).body,played.body);
  assert.equal((await post('/api/play',{...payload,rulesVersion:undefined})).status,409);
  const recovery=await(await fetch(origin+'/api/session?id='+session.sessionId)).json();assert.deepEqual(recovery.lastRound,played.body.round);
  const demo=await post('/api/scenario',{sessionId:session.sessionId,scenario:'retrigger',rulesVersion:REPEAT_RULES_VERSION});
  assert.equal(demo.body.round.retriggerCount,3);assert.equal(demo.body.round.spins,25);assert.equal(demo.body.balance,recovery.balance);
  await post('/api/play',{...payload,rulesVersion:undefined,requestId:'legacy-test-0002'});assert.equal(catalogCalls,1);
});
