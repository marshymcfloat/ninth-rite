import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createMascot} from '../public/style-2/mascot.mjs';
import {createIntervention} from '../public/style-2/intervention.mjs';
import {createPresentation} from '../public/style-2/game-view.mjs';
import {initialPlayback,applyRecordedEvent} from '../public/style-2/playback.mjs';
import {generateScenario,quietBoard} from '../scenarios.mjs';
import {MODES,RULES} from '../config.mjs';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const manifest=JSON.parse(await readFile(new URL('../public/style-2/manifest.json',import.meta.url)));
test('revelation retains earned progress until transfer, expiry preserves banked Offerings, God omits pending',async t=>{
  const dom=new JSDOM(html,{pretendToBeVisual:true,runScripts:'outside-only'}),doc=dom.window.document;
  dom.window.eval(await readFile(new URL('../public/vendor/gsap.min.js',import.meta.url),'utf8'));
  const gsap=dom.window.gsap;gsap.globalTimeline.timeScale(30);
  t.after(()=>{gsap.globalTimeline.clear();gsap.ticker.sleep();dom.window.close();});
  const $=id=>doc.getElementById(id),reactions=[];let writes=0,settlements=0;
  for(let i=0;i<3;i++)$('offerings').append(doc.createElement('i'));
  const animate=(targets,from,to)=>new Promise(resolve=>gsap.fromTo(targets,from,{...to,onComplete:resolve}));
  const readouts=model=>{writes++;$('multiplier').textContent=`×${model.state.tier}`;$('offeringNumber').textContent=String(model.state.offerings);$('pending').hidden=!model.pending;};
  const fx=createIntervention({document:doc,mascot:{react:(...args)=>reactions.push(args),settle:()=>settlements++},animate,quick:()=>false,noMotion:()=>false,readouts,manifest});
  $('multiplier').textContent='×16';
  await fx.invoke({tier:64,spin:1,cascade:0},{state:{tier:16,offerings:2},pending:64});
  assert.equal(fx.state,'waiting');assert.equal($('multiplier').textContent,'×16');assert.equal($('pending').querySelector('span').textContent,'PENDING');
  const reactionCount=reactions.length;
  fx.defer({tier:64});assert.equal(fx.state,'waiting');assert.equal($('pending').querySelector('span').textContent,'LAST CHANCE');assert.equal($('pending').querySelector('b').textContent,'Win on the next spin');
  assert.equal(reactions.length,reactionCount,'deferral retains halo without repeating invocation');assert.equal($('multiplier').textContent,'×16');
  const confirm=fx.confirm({tier:64,spin:1,cascade:1},{state:{tier:64,offerings:2},pending:null});
  assert.equal($('multiplier').textContent,'×16','earned tier must not update when transfer starts');
  await confirm;assert.equal($('multiplier').textContent,'×64');assert.equal($('offeringNumber').textContent,'2');assert.equal(fx.state,'idle');
  await fx.invoke({tier:128,spin:1,cascade:2},{state:{tier:64,offerings:1},pending:128});
  await fx.expire({tier:128,spin:1,cascade:3},{state:{tier:64,offerings:1},pending:null});
  assert.equal($('multiplier').textContent,'×64');assert.equal($('offeringNumber').textContent,'1');assert.equal($('pending').hidden,true);
  const god=fx.invoke({tier:250,spin:0},{state:{tier:250,offerings:0},pending:null},{guaranteed:true});
  assert.equal($('pending').querySelector('span').textContent,'GUARANTEED');await god;
  assert.equal($('multiplier').textContent,'×250');assert.equal(doc.querySelectorAll('.ceremony-bead,.revelation-dust').length,0);
  assert.deepEqual(reactions.map(r=>r[0]),['invocation','benediction','invocation','expiry','invocation']);assert.equal(settlements,1,'God continues its invocation directly into the transfer');assert.ok(writes>=3);
});

test('canceled ceremony cannot write a stale earned value after recovery',async()=>{
  const dom=new JSDOM(html,{pretendToBeVisual:true}),doc=dom.window.document;let finish=[];let writes=0;
  const fx=createIntervention({document:doc,mascot:{react(){}},animate:(nodes,from,to)=>new Promise(resolve=>finish.push(()=>{Object.assign(nodes[0],{t:1});to.onUpdate?.();resolve();})),quick:()=>false,noMotion:()=>false,readouts:()=>writes++});
  const result=fx.confirm({tier:128},{state:{tier:128},pending:null});fx.reset();finish.forEach(fn=>fn());await result;
  assert.equal(writes,0);assert.equal(fx.state,'idle');assert.equal(doc.getElementById('pending').hidden,true);dom.window.close();
});

test('static mascot priorities, duplicate keys, reduced motion and visibility never queue reactions',async()=>{
  const dom=new JSDOM(html,{pretendToBeVisual:true}),doc=dom.window.document;
  dom.window.HTMLMediaElement.prototype.pause=function(){};
  dom.window.HTMLMediaElement.prototype.load=function(){};
  dom.window.HTMLMediaElement.prototype.play=function(){return Promise.reject(new Error('autoplay blocked'));};
  const reduced={matches:false,addEventListener(){},removeEventListener(){}};
  const mascot=createMascot(doc.getElementById('mascot'),{reduced,manifest});
  assert.equal(mascot.react('bonus',{key:'entry'}),true);
  assert.equal(mascot.react('bonus',{key:'entry'}),false);
  assert.equal(mascot.react('altar',{key:'step'}),false);
  assert.equal(mascot.react('invocation',{key:'invoke'}),true);
  assert.equal(mascot.react('benediction',{key:'confirm'}),true);
  assert.equal(mascot.react('bonus',{key:'late'}),false);
  assert.equal(mascot.reaction,'benediction');
  mascot.cancel();assert.equal(mascot.reaction,'idle');
  reduced.matches=true;assert.equal(mascot.react('expiry',{key:'expire'}),true);
  assert.equal(doc.querySelectorAll('.mascot-reaction-video.is-visible').length,0);
  Object.defineProperty(doc,'hidden',{configurable:true,value:true});doc.dispatchEvent(new dom.window.Event('visibilitychange'));
  assert.equal(mascot.reaction,'idle');assert.equal(mascot.react('bonus',{key:'hidden'}),false);
  mascot.destroy();dom.window.close();
});

test('scatter and feature entry share one gesture, separate retriggers react, simultaneous progression does not duplicate intervention',async t=>{
  const dom=new JSDOM(html,{pretendToBeVisual:true}),doc=dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  const timer=setInterval(()=>doc.getElementById('featureContinue').click(),5);
  t.after(()=>{clearInterval(timer);dom.window.close();});
  const config={rules:RULES,modes:MODES,initialBoard:quietBoard()},reactions=[];
  const view=createPresentation({document:doc,config,mascot:{react:(name,options)=>reactions.push({name,...options})},options:()=>({reduced:true,fast:true}),format:String,manifest});
  const book={...generateScenario('intervention'),bet:1,payout:0};let model=initialPlayback(book,config);
  view.begin(book,model,{instant:false,replay:false});await view.board(quietBoard(),null,{still:true});
  await view.event({type:'naturalBonus',mode:'blood'},model,book);
  const entry=book.events.find(e=>e.type==='featureStart');model=applyRecordedEvent(model,entry,book);
  await view.event(entry,model,book);
  assert.equal(reactions.filter(r=>r.name==='bonus').length,1);
  for(const index of [20,40])await view.event({type:'retrigger',added:5,remaining:12},model,book,{index});
  const bonus=reactions.filter(r=>r.name==='bonus');assert.equal(bonus.length,3);assert.equal(new Set(bonus.map(r=>r.key)).size,3);
  reactions.length=0;model=initialPlayback(book,config);
  view.begin(book,model,{instant:false,replay:false});
  for(const [index,event] of book.events.entries()){
    if(index>8)break;model=applyRecordedEvent(model,event,book);
    await view.event(event,model,book,{index,previous:book.events[index-1],next:book.events[index+1]});
  }
  assert.equal(reactions.filter(r=>r.name==='invocation').length,1);
  assert.equal(reactions.filter(r=>r.name==='benediction').length,1,'one confirmation blends into the live blessing; ordinary progression adds no duplicate');
  assert.equal(reactions.filter(r=>r.name==='altar').length,0);
  view.end(book,model);
});

test('ready reaction clips do not flash the gesture poster; blocked playback falls back and late play cannot revive a canceled reaction',async()=>{
  const dom=new JSDOM(html,{pretendToBeVisual:true}),doc=dom.window.document;
  dom.window.Image=function(){const img=doc.createElement('img');Object.defineProperty(img,'complete',{value:true});Object.defineProperty(img,'naturalWidth',{value:600});return img;};
  dom.window.HTMLMediaElement.prototype.pause=function(){};
  dom.window.HTMLMediaElement.prototype.load=function(){};
  Object.defineProperty(dom.window.HTMLMediaElement.prototype,'readyState',{get:()=>4});
  dom.window.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){},getImageData:()=>({data:[0,0,0,0]})});
  let rejectPlay,resolvePlay;
  dom.window.HTMLMediaElement.prototype.play=function(){return new Promise((resolve,reject)=>{resolvePlay=resolve;rejectPlay=reject;});};
  doc.querySelector('#mascot video').removeAttribute('data-generated-idle');
  const videoManifest={...manifest,mascot:{...manifest.mascot,videoEnabled:true,reactions:{invocation:{...manifest.mascot.reactions.invocation,src:'/test-invocation.webm'}}}};
  const mascot=createMascot(doc.getElementById('mascot'),{manifest:videoManifest,reduced:{matches:false,addEventListener(){},removeEventListener(){}}});
  const clip=mascot.prepare('invocation').record;clip.video.dispatchEvent(new dom.window.Event('loadeddata'));
  assert.equal(clip.ready,true);mascot.react('invocation',{key:'first'});
  assert.equal(doc.querySelector('.mascot-reaction-pose').classList.contains('is-visible'),false);
  rejectPlay(new Error('blocked'));await Promise.resolve();await Promise.resolve();
  assert.equal(doc.querySelector('.mascot-reaction-pose').classList.contains('is-visible'),true);
  mascot.react('invocation',{key:'second'});mascot.cancel({resumeIdle:false});resolvePlay();await Promise.resolve();
  assert.equal(clip.video.classList.contains('is-visible'),false);assert.equal(mascot.reaction,'idle');
  mascot.destroy();dom.window.close();
});

test('ordinary presentation boundaries do not seek idle or cut off a finishing reaction',async t=>{
  const dom=new JSDOM(html,{pretendToBeVisual:true}),doc=dom.window.document;
  const idleVideo=doc.createElement('video');idleVideo.dataset.src='/test-idle.webm';doc.getElementById('mascot').append(idleVideo);
  dom.window.HTMLMediaElement.prototype.pause=function(){};
  dom.window.HTMLMediaElement.prototype.load=function(){};
  dom.window.HTMLMediaElement.prototype.play=async function(){};
  Object.defineProperty(dom.window.HTMLMediaElement.prototype,'readyState',{get:()=>4});
  dom.window.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){},getImageData:()=>({data:[0,0,0,0]})});
  const mascot=createMascot(doc.getElementById('mascot'),{manifest:{...manifest,mascot:{...manifest.mascot,videoEnabled:true}}});
  t.after(()=>{mascot.destroy();dom.window.close();});
  dom.window.dispatchEvent(new dom.window.Event('load'));await Promise.resolve();
  const idle=doc.querySelector('#mascot video'),config={rules:RULES,modes:MODES,initialBoard:quietBoard()};
  const view=createPresentation({document:doc,config,mascot,options:()=>({reduced:true,fast:false}),format:String,manifest});
  const book={...generateScenario('orphans'),bet:1,payout:0};let model=initialPlayback(book,config);
  idle.currentTime=2.35;view.begin(book,model,{instant:false,replay:false});
  for(const event of book.events)model=applyRecordedEvent(model,event,book);
  view.end(book,model);assert.equal(idle.currentTime,2.35);
  mascot.react('altar',{key:'earned-step'});view.end(book,model);
  assert.equal(mascot.reaction,'altar','finish the gesture naturally instead of jumping back at round end');
  view.skip();assert.equal(mascot.reaction,'idle','explicit skip still cancels reactions');
});
