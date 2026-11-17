import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {generateRound} from '../engine.mjs';
import {generateScenario,SCENARIOS,quietBoard,withCells} from '../scenarios.mjs';
import {MODES,RULES} from '../config.mjs';
import {playRecordedBook,initialPlayback,applyRecordedEvent} from '../public/style-2/playback.mjs';
import {createPresentation,clusterAwardPositions} from '../public/style-2/game-view.mjs';
import {createCollectionCanvas,streamPoint} from '../public/style-2/collection-fx.mjs';

const art=JSON.parse(await readFile(new URL('../public/assets/manifest.json',import.meta.url)));
const config={rules:RULES,modes:MODES,initialBoard:quietBoard(),art};
const wrap=book=>({...book,bet:1,cost:MODES[book.mode].cost,payout:book.totalHundredths/100});
test('Style 2 follows every event, survivor and payout across all modes and rule scenarios',async()=>{
  const books=[...Object.keys(MODES).filter(id=>!MODES[id].disabled).map(mode=>wrap(generateRound({mode,seed:'style2:'+mode}))),
    ...Object.keys(SCENARIOS).map(id=>wrap(generateScenario(id)))];
  for(const name of ['offering-confirmed','offering-expired','legacy-v1.4-response'])books.push(JSON.parse(await readFile(new URL(`fixtures/${name}.json`,import.meta.url))).round);
  for(const book of books){
    const seen=[];let paid=0;
    const state=await playRecordedBook(book,config,{event(event,model){
      seen.push(event.type);
      if(event.type==='cascade'){paid+=event.payoutHundredths;assert.equal(model.payout,event.totalHundredths*book.bet/100);}
      if(event.type==='interventionPending'){assert.equal(model.pending,event.tier);assert.equal(model.state.tier,event.state.tier);}
      if(event.type==='interventionExpired')assert.equal(model.pending,null);
      if(event.type==='board'&&!event.initial)assert.equal(model.moves.length,30);
    }},{instant:true});
    assert.equal(paid,book.totalHundredths,book.mode);
    assert.equal(state.payout,book.payout);assert.deepEqual(state.state,book.finalState);assert.equal(state.complete,true);
    assert.deepEqual(seen,book.events.map(e=>e.type));
    assert.equal(state.rules.bloodThreshold,book.rules?.bloodThreshold??3);
  }
});
test('purchased scatter entrances occur once and never add a paying event',async()=>{
  for(const [mode,count] of [['lesser',3],['blood',4],['greater',5],['god',1]]){
    const book=wrap(generateRound({mode,seed:'entrance'}));let entries=0;
    const state=await playRecordedBook(book,config,{purchase(board){entries++;assert.equal(board.flat().filter(c=>c.symbol==='S').length,count);},event(){}});
    assert.equal(entries,1);assert.equal(state.payout,book.payout);
  }
});
test('DOM renderer resolves skips, bonus counters, pending states and all symbols using recorded books',async()=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html);const doc=dom.window.document;
  const reactions=[];
  const view=createPresentation({document:doc,config,mascot:{react:s=>reactions.push(s)},options:()=>({reduced:true,fast:true}),format:n=>n.toFixed(2)});
  for(const id of ['intervention','intervention_expired','natural','retrigger','entity_cap','god_zero','orphans']){
    const book=wrap(generateScenario(id));await playRecordedBook(book,config,view,{instant:true});
    assert.equal(doc.querySelectorAll('#grid .cell').length,30);
    assert.equal(doc.getElementById('roundWin').textContent,book.payout.toFixed(2));
    assert.equal(doc.getElementById('multiplier').textContent,`×${book.finalState.tier}`);
    assert.equal(doc.getElementById('pending').hidden,true);
    assert.equal(doc.getElementById('remaining').textContent,'COMPLETE');
    assert.equal(doc.getElementById('blood').children.length,5);
    assert.equal(doc.getElementById('offerings').children.length,3);
  }
  assert.equal(reactions.length,0,'instant recovery does not replay promotional character gestures');
  dom.window.close();
});

test('real GSAP exits before replacement, preserves tumble survivors and finishes cleanly when skipped',async t=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{pretendToBeVisual:true,runScripts:'outside-only'}),doc=dom.window.document;
  dom.window.eval(await readFile(new URL('../public/vendor/gsap.min.js',import.meta.url),'utf8'));
  const gsap=dom.window.gsap;gsap.globalTimeline.timeScale(20);
  const centering=doc.createElement('style');centering.textContent='.cluster-award{transform:translate(-50%,-50%)}';doc.head.append(centering);
  const labelFrames=[],labelPhases=new Set(),anchors=new Map(),fromTo=gsap.fromTo.bind(gsap);
  gsap.fromTo=(targets,from,to)=>{
    assert.ok(!targets.some(el=>el.classList.contains('cluster-award')),'centering anchors must never be tween targets');
    if(!targets.some(el=>el.classList.contains('cluster-award-value')))return fromTo(targets,from,to);
    labelPhases.add(to.opacity===0?'exit':'enter');
    for(const target of targets){const anchor=target.parentElement;if(!anchors.has(anchor))anchors.set(anchor,anchor.style.cssText);}
    const inspect=()=>{for(const target of targets){const anchor=target.parentElement;if(anchor)labelFrames.push({samePosition:anchor.style.cssText===anchors.get(anchor),transform:dom.window.getComputedStyle(anchor).transform});}};
    return fromTo(targets,from,{...to,onUpdate:inspect,onComplete(){inspect();to.onComplete?.();}});
  };
  t.after(()=>{gsap.globalTimeline.clear();gsap.ticker.sleep();dom.window.close();});
  const view=createPresentation({document:doc,gsap,config,mascot:{react(){}},options:()=>({reduced:false,fast:false}),format:n=>n.toFixed(2)});
  const book=wrap(generateScenario('orphans')),grid=doc.getElementById('grid');
  view.begin(book,initialPlayback(book,config),{instant:false,replay:false});
  await view.board(quietBoard(),null,{still:true});
  const old=grid.firstElementChild;
  const first=book.events.find(e=>e.type==='board');
  const transition=view.board(first.board);
  assert.equal(grid.firstElementChild,old,'old symbols remain attached during their exit');
  assert.ok(grid.classList.contains('in-motion'));
  await transition;
  assert.notEqual(grid.firstElementChild,old);
  assert.equal(grid.querySelectorAll('.symbol-token[style]').length,0);
  let state=initialPlayback(book,config),sawClear=false,sawTumble=false;
  for(const event of book.events){
    state=applyRecordedEvent(state,event,book);
    if(event.type==='cascade'){
      const winning=view.event(event,state,book);
      assert.equal(grid.querySelectorAll('.symbol-halo').length,event.clusters.flatMap(c=>c.positions).length);
      assert.equal(grid.querySelectorAll('.orphan .symbol-halo').length,0,'non-paying orphans do not celebrate');
      assert.deepEqual([...doc.querySelectorAll('.cluster-award')].map(el=>el.textContent),event.clusters.map(c=>(c.payoutHundredths*book.bet/100).toFixed(2)));
      assert.equal(doc.getElementById('tumbleAward').hidden,true);
      await winning;sawClear=true;
      assert.equal(doc.querySelectorAll('.cluster-award').length,0);
      assert.equal(grid.querySelectorAll('.symbol-halo,.relic-light,.symbol-gleam').length,0);
      for(const p of event.clearPositions)assert.equal(grid.children[p].firstElementChild.style.opacity,'0');
      assert.equal(grid.querySelectorAll('.rite-spark').length,0);
    }
    if(event.type==='board'&&state.moves){
      const previous=[...grid.children].map(el=>el.firstElementChild);
      await view.board(event.board,state.moves);
      for(const move of state.moves)if(move.from!==null)assert.equal(grid.children[move.to].firstElementChild,previous[move.from],'survivor artwork is retained');
      sawTumble=true;break;
    }
  }
  assert.ok(sawClear&&sawTumble);
  assert.deepEqual([...labelPhases],['enter','exit']);
  assert.ok(labelFrames.length>0);
  assert.ok(labelFrames.every(frame=>frame.samePosition&&frame.transform==='translate(-50%,-50%)'),'label anchors stay centered through entrance, hold and exit');
  const skipped=view.board(quietBoard());view.skip();await skipped;
  assert.equal(grid.children.length,30);
  assert.equal(grid.querySelectorAll('.symbol-token[style],.rite-spark').length,0);
  assert.equal(grid.classList.contains('in-motion'),false);
  // Skip the entrance after its exit has completed, while drop tweens are active.
  view.begin(book,initialPlayback(book,config),{instant:false,replay:false});
  const beforeDrop=grid.firstElementChild,drop=view.board(first.board);
  const deadline=Date.now()+2000;
  while(grid.firstElementChild===beforeDrop){assert.ok(Date.now()<deadline);await new Promise(r=>setTimeout(r,1));}
  view.skip();await drop;
  assert.equal(grid.querySelectorAll('.symbol-token[style]').length,0);
  assert.equal(grid.classList.contains('in-motion'),false);
  // A scatter board alone does not announce a feature. Only its recorded award does.
  view.begin(book,initialPlayback(book,config),{instant:false,replay:false});
  await view.board(withCells(quietBoard(),[7,16,25],'S'),null,{still:true});
  assert.equal(grid.querySelectorAll('.scatter-active,.ritual-halo').length,0);
  const natural=view.event({type:'naturalBonus',mode:'lesser'},state,book);
  assert.equal(grid.querySelectorAll('.scatter-active').length,3);
  assert.equal(grid.querySelectorAll('.scatter-active:not([data-symbol=S])').length,0);
  assert.ok(grid.closest('.reels').classList.contains('ritual-active'));
  await natural;
  assert.equal(grid.querySelectorAll('.scatter-active,.ritual-halo,.symbol-gleam,.symbol-token[style]').length,0);
  assert.equal(grid.classList.contains('scatter-focus'),false);
  assert.equal(grid.closest('.reels').classList.contains('ritual-active'),false);
  assert.equal(doc.getElementById('tumbleAward').hidden,true);
  view.begin(book,initialPlayback(book,config),{instant:false,replay:false});
  const retrigger=view.event({type:'retrigger',added:5,remaining:12},state,book);
  assert.equal(grid.querySelectorAll('.scatter-active').length,3);
  view.skip();await retrigger;
  assert.equal(grid.querySelectorAll('.symbol-halo,.relic-light,.symbol-gleam,.symbol-token[style]').length,0);
  assert.equal(doc.getElementById('tumbleAward').hidden,true);
});

test('cluster amounts stay over winning cells and avoid adjacent labels and board edges',()=>{
  const clusters=Array.from({length:6},(_,col)=>({positions:Array.from({length:5},(_,row)=>row*6+col)}));
  const positions=clusterAwardPositions(clusters);
  positions.forEach((p,i)=>{
    assert.ok(p.x>=0&&p.x<=100&&p.y>=0&&p.y<=100);
    const x=p.x/100*6,y=p.y/100*5;
    assert.ok(clusters[i].positions.includes(Math.floor(y)*6+Math.floor(x)));
    for(let j=0;j<i;j++)assert.ok(Math.abs(x-positions[j].x/100*6)>=1.4||Math.abs(y-positions[j].y/100*5)>=.55);
  });
  const irregular=[{positions:[0,1,2,3,4,10,16,22]}];
  const [p]=clusterAwardPositions(irregular);
  assert.ok(irregular[0].positions.includes(Math.floor(p.y/100*5)*6+Math.floor(p.x/100*6)),'L-shaped cluster label stays on its symbols');
});

test('bonus reveal uses recorded awards and rite art, dismisses once and can skip during motion',async t=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{pretendToBeVisual:true,runScripts:'outside-only'}),doc=dom.window.document,$=id=>doc.getElementById(id);
  dom.window.eval(await readFile(new URL('../public/vendor/gsap.min.js',import.meta.url),'utf8'));
  const gsap=dom.window.gsap;gsap.globalTimeline.timeScale(10);
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  t.after(()=>{gsap.globalTimeline.clear();gsap.ticker.sleep();dom.window.close();});
  const view=createPresentation({document:doc,gsap,config,mascot:{react(){}},options:()=>({reduced:false,fast:false}),format:n=>n.toFixed(2)});
  for(const mode of ['lesser','blood','greater','god']){
    const book=wrap(generateRound({mode,seed:'feature-reveal'})),event=book.events.find(e=>e.type==='featureStart');
    const model=applyRecordedEvent(initialPlayback(book,config),event,book);
    view.begin(book,model,{instant:false,replay:false});
    let finished=0;const reveal=view.event(event,model,book).then(()=>finished++);
    assert.equal($('featureDialog').open,true);assert.equal($('featureDialog').dataset.kind,'entry');
    const artUrl=mode==='god'?'/style-2/media/engraved-v1/rite-god.webp':`/assets/bonus-entry-${mode}.webp`;
    assert.equal($('featureArt').getAttribute('src'),artUrl);
    assert.equal($('featureValue').textContent,String(event.spins));assert.equal($('featureAltarValue').textContent,`×${event.state.tier}`);
    assert.equal($('featureSkip').hidden,false);
    if(mode==='god'){view.skip();assert.equal($('featureDialog').open,false);}
    else{
      $('featureContinue').click();$('featureContinue').click();
      assert.equal($('featureDialog').open,true,'exit keeps the dialog visible until its animation completes');
      assert.equal($('featureDialog').classList.contains('is-leaving'),true);
    }
    await reveal;assert.equal(finished,1);assert.equal($('featureDialog').open,false);
    assert.equal($('featureContent').getAttribute('style')||'','');
    if(mode==='blood'){
      const retrigger=view.event({type:'retrigger',added:5,remaining:12},model,book);
      await new Promise(resolve=>setTimeout(resolve,0));
      assert.equal($('featureDialog').dataset.kind,'retrigger');assert.equal($('featureValue').textContent,'+5');
      assert.equal($('featureArt').getAttribute('src'),'/assets/bonus-retrigger.webp');
      assert.equal($('featureAltarLabel').textContent,'CURRENT ALTAR');
      view.skip();await retrigger;assert.equal($('featureDialog').open,false);
    }
  }
});

test('Offering seals collect only recorded wins, retain meter nodes and clean up on skip',{timeout:10000},async t=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{pretendToBeVisual:true,runScripts:'outside-only'}),doc=dom.window.document,$=id=>doc.getElementById(id);
  dom.window.eval(await readFile(new URL('../public/vendor/gsap.min.js',import.meta.url),'utf8'));
  const gsap=dom.window.gsap;gsap.globalTimeline.timeScale(15);
  let collectionStarted;
  const observer=new dom.window.MutationObserver(()=>{if(doc.querySelector('.collection-mote'))collectionStarted?.();});observer.observe(doc.body,{childList:true,subtree:true});
  t.after(()=>observer.disconnect());
  t.after(()=>{gsap.globalTimeline.clear();gsap.ticker.sleep();dom.window.close();});
  let reduced=false;const received=[];
  const view=createPresentation({document:doc,gsap,config,mascot:{react(name){if(name==='offering')received.push(name);}},options:()=>({reduced,fast:false}),format:n=>n.toFixed(2)});
  const book=wrap(generateRound({mode:'blood',seed:'offering-flight'}));
  let before=initialPlayback(book,config),event,after;
  for(const candidate of book.events){
    after=applyRecordedEvent(before,candidate,book);
    if(candidate.type==='cascade'&&candidate.offeringsCollected>0){event=candidate;break;}
    before=after;
  }
  assert.ok(event);
  for(const skipDuringCollection of [false,true]){
    received.length=0;
    view.begin(book,before,{instant:false,replay:false});await view.board(before.board,null,{still:true});
    const vessels=[...$('offerings').children],blood=[...$('blood').children];
    assert.equal(doc.querySelectorAll('.cell .mark img').length,before.board.flat().filter(c=>c.marked).length);
    const collected=new Promise(resolve=>{collectionStarted=resolve;});
    const playing=view.event(event,after,book);await collected;
    assert.equal(doc.querySelectorAll('.offering-mote').length,event.offeringsCollected);
    assert.equal(doc.querySelectorAll('.blood-mote').length,event.bloodCollected);
    if(skipDuringCollection)view.skip();
    await playing;
    assert.equal(received.length,skipDuringCollection?0:event.offeringsCollected,'skip must not dispatch arrivals from forcibly completed tweens');
    assert.equal(doc.querySelectorAll('.collection-mote').length,0);
    assert.equal(doc.querySelectorAll('.is-receiving,.meter-fill[style]').length,0);
    assert.deepEqual([...$('offerings').children],vessels);assert.deepEqual([...$('blood').children],blood);
    assert.equal($('offeringNumber').textContent,`${after.state.offerings} / ${after.rules.offeringThreshold}`);
    assert.equal($('bloodNumber').textContent,`${after.state.blood} / ${after.rules.bloodThreshold}`);
    assert.equal($('offerings').querySelectorAll('.filled').length,Math.min(after.state.offerings,after.rules.offeringThreshold));
  }
  reduced=true;view.begin(book,before,{instant:false,replay:false});await view.board(before.board,null,{still:true});
  const staticWin=view.event(event,after,book);assert.equal(doc.querySelectorAll('.collection-mote').length,0);view.skip();await staticWin;
});

test('bloodstreams follow finite curved paths, draw layered liquid and clear their canvas',()=>{
  const from={x:230,y:430},to={x:650,y:80};
  assert.deepEqual(streamPoint(from,to,0),from);assert.deepEqual(streamPoint(from,to,1),to);
  const middle=streamPoint(from,to,.5);assert.ok(middle.y<(from.y+to.y)/2);
  const calls=[];
  const context=new Proxy({createRadialGradient(){calls.push('gradient');return {addColorStop(){}};}},{get(target,key){return target[key]??((...args)=>{assert.ok(args.every(value=>typeof value!=='number'||Number.isFinite(value)));calls.push(key);});},set(target,key,value){target[key]=value;return true;}});
  const canvas={setAttribute(){},getContext(){return context;}},layer={prepend(node){assert.equal(node,canvas);}};
  const fakeDocument={defaultView:{CanvasRenderingContext2D:class{},devicePixelRatio:3},createElement(){return canvas;}};
  const fx=createCollectionCanvas(fakeDocument,layer);fx.resize({width:1000,height:560});
  assert.equal(canvas.width,2000);assert.equal(canvas.height,1120);
  for(const time of [.1,.3,.56,.7,.9])fx.draw([{from,to,kind:'blood',delay:0,bend:70},{from,to,kind:'offerings',delay:.08,bend:90}],time);
  assert.ok(calls.includes('stroke'));assert.ok(calls.includes('fill'));assert.ok(calls.includes('gradient'));assert.ok(calls.includes('ellipse'));
  fx.clear();assert.equal(calls.at(-1),'clearRect');
});
