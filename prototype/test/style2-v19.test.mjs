import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {candidateScenario} from '../scenarios-v19.mjs';
import {MODES,RULES} from '../rules-v19.mjs';
import {quietBoard} from '../scenarios.mjs';
import {createPresentation} from '../public/style-2/game-view.mjs';
import {initialPlayback,applyRecordedEvent,playRecordedBook} from '../public/style-2/playback.mjs';
const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const config={modes:MODES,rules:RULES,initialBoard:quietBoard()};
test('two-chance replay, skip and hidden-tab handling retain exact final state with no stale pending halo',async t=>{
  const dom=new JSDOM(html,{pretendToBeVisual:true}),doc=dom.window.document;
  t.after(()=>dom.window.close());
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  let reduced=true;const view=createPresentation({document:doc,config,mascot:{react(){},cancel(){}},options:()=>({reduced,fast:true}),format:String});
  for(const name of ['deferred_confirm','deferred_expire','final_expire','retrigger']){
    const raw=candidateScenario(name),book={...raw,bet:1,payout:raw.totalHundredths/100};
    const final=await playRecordedBook(book,config,view,{instant:true,replay:true});assert.deepEqual(final.state,book.finalState);
    assert.equal(final.pending,null);assert.equal(doc.getElementById('pending').hidden,true);assert.equal(doc.getElementById('multiplier').textContent,`×${book.finalState.tier}`);
  }
  const raw=candidateScenario('deferred_confirm'),book={...raw,bet:1,payout:raw.totalHundredths/100};let model=initialPlayback(book,config);
  view.begin(book,model,{instant:false,replay:true});
  const until=book.events.findIndex(e=>e.type==='interventionDeferred');
  for(let i=0;i<=until;i++){
    const event=book.events[i];model=applyRecordedEvent(model,event,book);
    if(event.type==='featureStart'){view.readouts(model);continue;}
    await view.event(event,model,book,{index:i});
  }
  assert.equal(doc.getElementById('multiplier').textContent,'×16');assert.equal(doc.getElementById('pending').querySelector('span').textContent,'LAST CHANCE');
  const spin=book.events.find(e=>e.type==='spinStart'&&e.spin===2);model=applyRecordedEvent(model,spin,book);await view.event(spin,model,book);
  assert.equal(doc.getElementById('pending').hidden,false);assert.equal(doc.querySelector('.revelation').dataset.phase,'waiting');
  Object.defineProperty(doc,'hidden',{configurable:true,value:true});doc.dispatchEvent(new dom.window.Event('visibilitychange'));view.skip();
  for(const event of book.events.slice(until+1)){model=applyRecordedEvent(model,event,book);await view.event(event,model,book);}
  view.end(book,model);assert.deepEqual(model.state,book.finalState);assert.equal(doc.getElementById('pending').hidden,true);assert.equal(doc.querySelector('.revelation').hidden,true);
});
