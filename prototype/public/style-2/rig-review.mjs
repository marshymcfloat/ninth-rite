import {createMascot} from './mascot.mjs';
const root=document.getElementById('mascot'),status=document.getElementById('status'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const manifest=await fetch('/style-2/manifest.json').then(r=>r.json()),version=new URLSearchParams(location.search).get('rig');
manifest.mascot.rig={...manifest.mascot.rig,enabled:true};
if(['v1','v2'].includes(version))manifest.mascot.rig.url=`/style-2/media/engraved-rig-${version}/rig.json`;
const mascot=createMascot(root,{reduced,manifest});await mascot.ready();
let sequence=0,paused=false,timers=[],background=0;
function clear(){timers.forEach(clearTimeout);timers=[];}
function play(name){mascot.react(name,{key:'review:'+sequence++});}
document.querySelectorAll('[data-reaction]').forEach(button=>button.addEventListener('click',()=>{clear();play(button.dataset.reaction);}));
document.getElementById('interrupt').onclick=()=>{clear();mascot.cancel();play('invocation');timers.push(setTimeout(()=>play('benediction'),530),setTimeout(()=>play('bonus'),610),setTimeout(()=>play('win'),680));};
document.getElementById('reset').onclick=()=>{clear();mascot.cancel();};
document.getElementById('pause').onclick=event=>{paused=!paused;mascot.setPaused(paused);event.target.textContent=paused?'Resume':'Pause';};
document.getElementById('background').onclick=()=>document.querySelector('.stage').dataset.background=['chapel','gray','light','black'][++background%4];
const monitor=setInterval(()=>{const s=mascot.inspect();status.textContent=s.frames===undefined?'Still fallback: '+(root.dataset.rigError||'loading'):'Rig active · '+s.parts+' layers · '+s.reaction+' · '+s.count+' gestures · '+s.frames+' frames';},300);
window.__rigReview={mascot,play};
window.addEventListener('pagehide',()=>{clear();clearInterval(monitor);mascot.destroy();},{once:true});
