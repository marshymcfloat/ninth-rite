import test from 'node:test';
import assert from 'node:assert/strict';
import {createMascot,registeredMascotBox} from '../public/style-2/mascot.mjs';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

function setup(alpha=0,generated){
  const dom=new JSDOM('<button id="mascot"><video data-src="clip.webm"></video></button>',{pretendToBeVisual:true});
  const window=dom.window,document=window.document,root=document.getElementById('mascot'),video=root.querySelector('video');
  Object.defineProperty(document,'hidden',{configurable:true,writable:true,value:false});
  Object.defineProperty(document,'readyState',{configurable:true,value:'loading'});
  Object.defineProperty(video,'readyState',{value:2});
  if(generated){
    video.setAttribute('data-generated-idle','');
    Object.defineProperties(video,{duration:{value:generated.footage.duration},paused:{value:false}});
    window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  }
  window.HTMLCanvasElement.prototype.getContext=()=>({drawImage(){},getImageData:()=>({data:[0,0,0,alpha]})});
  Object.assign(video,{loads:0,plays:0,pauses:0,load(){this.loads++;},async play(){this.plays++;},pause(){this.pauses++;}});
  const reduced=new window.EventTarget();reduced.matches=false;
  return {document,window,video,classes:{has:v=>root.classList.contains(v)},reduced,controller:createMascot(root,{reduced,manifest:{mascot:{generated}}})};
}
const settle=()=>new Promise(resolve=>queueMicrotask(resolve));

test('engraved reaction registration preserves the same standing anchors and proportions',()=>{
  const {mascot}=JSON.parse(readFileSync(new URL('../public/style-2/manifest.json',import.meta.url),'utf8'));
  const reference=mascot.registration.idle;
  for(const [width,height] of [[364,464],[124,161],[100,460],[500,180]]){
    const fit=Math.min(width/reference.canvas[0],height/reference.canvas[1]);
    const footX=(width-reference.canvas[0]*fit)/2+reference.footX*fit;
    const footY=(height-reference.canvas[1]*fit)/2+reference.footY*fit;
    const headY=(height-reference.canvas[1]*fit)/2+reference.headY*fit;
    for(const [name,spec] of Object.entries(mascot.reactions)){
      for(const asset of Object.values(spec.registration)){
        const box=registeredMascotBox(width,height,reference,asset),scale=box.height/asset.canvas[1];
        const offset=(asset.offsetX||0)*fit;
        assert.ok(Math.abs(box.left+asset.footX*scale-footX-offset)<.001,name+' foot x');
        assert.ok(Math.abs(box.top+asset.footY*scale-footY)<.001,name+' baseline');
        assert.ok(Math.abs(box.top+asset.headY*scale-headY)<.001,name+' neutral height');
        assert.ok(Math.abs(box.width/asset.canvas[0]-scale)<.001,name+' proportions');
      }
    }
  }
});

test('engraved mascot works without video and cancels registered poses cleanly',async t=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/style-2/manifest.json',import.meta.url),'utf8'));
  const dom=new JSDOM('<button id="mascot"><img class="mascot-poster"></button>',{pretendToBeVisual:true});
  const {document}=dom.window,root=document.getElementById('mascot');
  Object.defineProperties(root,{clientWidth:{value:300},clientHeight:{value:480}});
  dom.window.Image=function(){const image=document.createElement('img');Object.defineProperties(image,{complete:{value:true},naturalWidth:{value:1000}});return image;};
  const mascot=createMascot(root,{manifest});t.after(()=>{mascot.destroy();dom.window.close();});
  dom.window.dispatchEvent(new dom.window.Event('load'));await settle();
  const neutral=root.querySelector('.mascot-poster');
  assert.equal(neutral.getAttribute('src'),manifest.mascot.idlePoster);
  assert.equal(neutral.style.width,'300px');assert.equal(neutral.style.height,'480px');
  for(const name of ['bonus','invocation','benediction','expiry']){
    assert.equal(mascot.react(name,{key:name}),true);
    const pose=root.querySelector('.mascot-reaction-pose');
    assert.equal(pose.getAttribute('src'),manifest.mascot.reactions[name].poster);
    assert.equal(pose.style.left,neutral.style.left);assert.equal(pose.style.top,neutral.style.top);
    assert.equal(pose.style.width,neutral.style.width);assert.equal(pose.style.height,neutral.style.height);
    assert.ok(pose.classList.contains('is-visible'));mascot.cancel();
    assert.equal(mascot.reaction,'idle');assert.ok(!root.classList.contains('is-reacting'));
  }
  assert.equal(root.querySelector('video'),null);assert.ok(!root.classList.contains('is-playing'));
});

test('mascot waits for essential load and suspends video in hidden tabs',async t=>{
  const s=setup();t.after(()=>{s.controller.destroy();s.window.close();});s.controller.setPaused(false);assert.equal(s.video.loads,0);
  s.window.dispatchEvent(new s.window.Event('load'));await settle();
  assert.equal(s.video.loads,1);assert.ok(s.classes.has('is-playing'));
  s.document.hidden=true;s.document.dispatchEvent(new s.window.Event('visibilitychange'));await settle();
  assert.ok(!s.classes.has('is-playing'));
  assert.ok(s.video.pauses>0);
  s.document.hidden=false;s.document.dispatchEvent(new s.window.Event('visibilitychange'));await settle();
  assert.equal(s.video.loads,1);assert.ok(s.classes.has('is-playing'));
  s.video.dispatchEvent(new s.window.Event('error'));assert.ok(!s.classes.has('is-playing'));
});
test('reduced motion avoids the optional download and uses the poster',async t=>{
  const s=setup();t.after(()=>{s.controller.destroy();s.window.close();});s.reduced.matches=true;s.window.dispatchEvent(new s.window.Event('load'));await settle();
  assert.equal(s.video.loads,0);assert.ok(!s.classes.has('is-playing'));
});
test('opaque alpha decoding keeps the poster instead of showing a black rectangle',async t=>{
  const s=setup(255);t.after(()=>{s.controller.destroy();s.window.close();});s.window.dispatchEvent(new s.window.Event('load'));await settle();
  assert.ok(!s.classes.has('is-playing'));assert.ok(s.video.pauses>0);
});

test('round boundaries preserve idle time and an active invocation settles without restarting',async t=>{
  const s=setup();t.after(()=>{s.controller.destroy();s.window.close();});
  s.window.dispatchEvent(new s.window.Event('load'));await settle();
  s.video.currentTime=2.35;const pauses=s.video.pauses;
  s.controller.beginRound();s.controller.cancel();await settle();
  assert.equal(s.video.currentTime,2.35);assert.equal(s.video.pauses,pauses,'idle is not stopped between normal spins');
  s.controller.react('invocation',{key:'invoke:1:1'});
  s.controller.settle();assert.equal(s.controller.reaction,'invocation');
  assert.equal(s.controller.react('altar',{key:'altar:1:1'}),false);
  assert.equal(s.controller.react('invocation',{key:'invoke:1:2'}),false,'resolution cannot be replaced by another lower-priority invocation');
  s.controller.beginRound();assert.equal(s.controller.reaction,'invocation','a round boundary does not cut off a current gesture');
});

test('the generated priest preserves the full hand descent on narrow screens',async t=>{
  t.mock.timers.enable({apis:['setTimeout']});
  const s=setup(0,{footage:{duration:20},reactions:{invocation:{segment:[12,16]}}});
  t.after(()=>{s.controller.destroy();s.window.close();});
  const frame=time=>{
    s.video.currentTime=time;
    s.video.dispatchEvent(new s.window.Event('timeupdate'));
  };

  s.controller.prepare('invocation');
  s.window.dispatchEvent(new s.window.Event('load'));
  await settle();
  assert.ok(s.controller.react('invocation'));
  frame(11.8);
  assert.equal(s.controller.clipTime('invocation'),0);

  t.mock.timers.tick(3400);
  frame(12.04);
  t.mock.timers.tick(2750);
  frame(14.75);
  assert.equal(s.controller.clipTime('invocation'),2.75);
  t.mock.timers.tick(1100);
  frame(15.7);
  assert.equal(s.controller.reaction,'invocation');
  frame(15.75);
  assert.equal(s.controller.reaction,'idle');
  assert.equal(s.video.currentTime,0);
});
