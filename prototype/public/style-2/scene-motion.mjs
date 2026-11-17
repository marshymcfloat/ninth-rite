import {createCelebrationLights} from './collection-fx.mjs';
import {artBox, getArt} from './art.mjs';
import {WIN_TIERS} from '../ceremony.mjs';

export const DESKTOP_MOTION_QUERY = '(min-width: 1024px) and (min-height: 541px) and (min-aspect-ratio: 1/1) and (hover: hover) and (pointer: fine)';
export const playbackSpeed = ({speed,fast}) => speed ?? (fast ? 2 : 1);
const celebrationSources = {blood:'#blood .blood-gem', offering:'#offerings .offering-gem', scatter:'#grid .scatter-active'};
const winReveals = {
  big: {from:{y:20,scale:.96}, duration:.55, ease:'power2.out', sparks:8},
  mega: {from:{x:-22,rotation:-5,scale:.91}, duration:.75, ease:'power3.out', sparks:12},
  epic: {from:{y:-25,scale:.89}, duration:.9, ease:'back.out(1.3)', sparks:16},
  divine: {from:{rotation:4,scale:.81}, duration:1.05, ease:'power3.out', sparks:20},
  cap: {from:{y:25,scale:.74}, duration:1.22, ease:'power3.out', sparks:24},
};

export function createSceneMotion({document,gsap,options,mascot}){
  const scene=document.querySelector('.scene'),win=document.defaultView;
  if(!scene||!gsap?.timeline)return {pulse(){},celebrate(){},flashSpin(){},meterLights(){},clearLights(){},desktopMotion:()=>false,cascadeEffect:()=>null,ceremony(){return {finish(){}};},destroy(){}};
  const ambient=document.createElement('div');ambient.className='chapel-life';ambient.setAttribute('aria-hidden','true');
  const make=className=>{const el=document.createElement('div');el.className=className;ambient.append(el);return el;};
  for(const layer of ['chapel-shaft left','chapel-shaft right','chapel-lamp left','chapel-lamp right','chapel-floor-mist'])make(layer);
  const dust=make('chapel-dust');
  for(let i=0;i<22;i++){
    const el=document.createElement('i');
    el.style.left=(i%2?77+(i*13%20):2+(i*7%16))+'%';el.style.top=(12+i*23%72)+'%';
    el.style.setProperty('--dust-duration',`${6+i%5}s`);
    el.style.setProperty('--dust-delay',`${-i*.37}s`);
    el.style.setProperty('--dust-opacity',.14+(i%4)*.06);
    dust.append(el);
  }
  const response=make('chapel-response');scene.prepend(ambient);
  const loop = scene.querySelector('.cathedral-loop');
  const desktop = win.matchMedia?.(DESKTOP_MOTION_QUERY);
  const backdrop = document.createElement('canvas');
  const context = loop?.requestVideoFrameCallback && win.CanvasRenderingContext2D
    ? backdrop.getContext('2d',{alpha:false,desynchronized:true}) : null;
  let canLoop = Boolean(context && loop?.canPlayType('video/webm; codecs="vp9"'));
  if(canLoop){
    backdrop.className='cathedral-canvas';backdrop.setAttribute('aria-hidden','true');loop.after(backdrop);
  }
  const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const priest = document.getElementById('mascot');
  const featureDialog = document.getElementById('featureDialog');
  const canLight = () => desktop?.matches === true && !document.hidden && !options().reduced;
  const lights = createCelebrationLights({document, gsap, enabled:canLight});
  let pulse = null;
  let activeCeremony = null;
  let wantsLoop = false, backgroundFrame = null;

  function point(element, host) {
    const bounds = element.getBoundingClientRect();
    const parent = host.getBoundingClientRect();
    return {x:bounds.left - parent.left + bounds.width / 2, y:bounds.top - parent.top + bounds.height / 2};
  }
  function celebrate(kind) {
    if (!canLight() || !priest) return;
    const selector = celebrationSources[kind];
    const center = point(priest,scene);
    const sources = selector ? [...scene.querySelectorAll(selector)].map(node => point(node,scene)) : [];
    lights.play(kind, {
      host:scene,
      origin:() => mascot?.getAnchor?.('vessel', scene) || center,
      points:() => sources,
      rate:playbackSpeed(options()),
    });
  }
  function flashSpin(element) {
    if (!canLight()) return;
    const center = point(element,scene);
    lights.play('spin', {host:scene,origin:() => center});
  }
  const preview = () => celebrate('offering');

  function drawLoop() {
    backgroundFrame = null;
    if (!wantsLoop || loop.paused) return;
    if (loop.readyState >= 2 && loop.videoWidth) {
      const width = Math.min(loop.videoWidth,1104), height = Math.round(width*loop.videoHeight/loop.videoWidth);
      if(backdrop.width!==width||backdrop.height!==height){backdrop.width=width;backdrop.height=height;}
      try{context.drawImage(loop,0,0,width,height);}catch{
        canLoop=false;wantsLoop=false;loop.pause();hideLoop();return;
      }
      if(!scene.hasAttribute('data-cathedral-loop'))scene.setAttribute('data-cathedral-loop','');
    }
    backgroundFrame = loop.requestVideoFrameCallback(drawLoop);
  }
  function showLoop() {
    if (wantsLoop && backgroundFrame === null) drawLoop();
  }
  function hideLoop() {
    if(backgroundFrame!==null)loop.cancelVideoFrameCallback(backgroundFrame);
    backgroundFrame=null;
    scene.removeAttribute('data-cathedral-loop');
  }
  function sync() {
    const stop = document.hidden || options().reduced;
    const covered = Boolean(featureDialog?.open && !featureDialog.classList.contains('is-leaving'));
    scene.toggleAttribute('data-feature-covered',covered);
    mascot?.setCovered?.(covered);
    const useLoop = Boolean(canLoop && desktop?.matches && !stop && !covered && (scene.dataset.environment ?? 'base') === 'base');
    if (useLoop !== wantsLoop) {
      wantsLoop = useLoop;
      if (useLoop) {
        if (!loop.hasAttribute('src')) loop.src = loop.dataset.src;
        loop.play().catch(() => {if(wantsLoop)hideLoop();});
      } else {
        loop.pause();
        hideLoop();
      }
    }
    ambient.hidden = stop || covered;
    if (canLight()) lights.prepare();
    else lights.clear();
    if (stop) {
      pulse?.kill();
      pulse = null;
      activeCeremony?.finish();
    }
  }
  const observer = new win.MutationObserver(sync);
  observer.observe(scene, {attributes:true, attributeFilter:['class', 'data-environment']});
  if(featureDialog)observer.observe(featureDialog,{attributes:true,attributeFilter:['open','class']});
  loop?.addEventListener('playing', showLoop);
  loop?.addEventListener('pause', hideLoop);
  loop?.addEventListener('error', hideLoop);
  document.addEventListener('visibilitychange', sync);
  media?.addEventListener('change', sync);
  desktop?.addEventListener('change', sync);
  priest?.addEventListener('mascot-preview', preview);
  sync();
  function ceremony(dialog,{kind,tier,amount,format,finalText}){
    const value=document.getElementById('featureValue');
    if(options().reduced||document.hidden)return {finish(){value.textContent=finalText;}};
    const content=dialog.querySelector('.feature-content')||document.getElementById('featureContent'),reveal=dialog.querySelector('.feature-reveal');
    const bonus = kind === 'entry' || kind === 'retrigger';
    const bonusReveal = dialog.hasAttribute('data-bonus-reveal');
    const summary = kind === 'result';
    const winReveal = winReveals[tier];
    let renderedLight=false;
    if (bonus || winReveal) {
      const relic = reveal.querySelector('.feature-relic');
      const center = point(relic,reveal);
      const effect=winReveal?`win-${tier}`:bonusReveal?`rite-${dialog.dataset.rite}`:'scatter';
      renderedLight=lights.play(effect, {
        host:reveal, origin:() => center, large:true, rate:Math.sqrt(playbackSpeed(options())),
      });
    }
    const field=document.createElement('div');field.className='feature-sparks';field.setAttribute('aria-hidden','true');
    const rays=document.createElement('div');rays.className='feature-light-reveal';rays.setAttribute('aria-hidden','true');
    const count=renderedLight?0:winReveal?.sparks??(bonus?16:0);
    for(let i=0;i<count;i++){const p=document.createElement('i');p.style.left=(25+(i*31%50))+'%';p.style.top=(30+i*17%45)+'%';field.append(p);}
    const tl=gsap.timeline();
    const revealTargets=[];
    if(winReveal){
      const title=dialog.querySelector('#featureTitle');
      const aura=reveal.querySelector('.feature-aureole');
      const {from,duration,ease}=winReveal;
      revealTargets.push(title,reveal,aura);
      tl.timeScale(Math.sqrt(playbackSpeed(options())));
      tl.fromTo(title,{opacity:.5,y:8,filter:'blur(3px)'},
        {opacity:1,y:0,filter:'blur(0px)',duration:.42,ease:'power2.out',clearProps:'opacity,transform,filter'},0);
      tl.fromTo(reveal,{opacity:0,...from},
        {opacity:1,x:0,y:0,scale:1,rotation:0,duration,ease,clearProps:'opacity,transform'},.06);
      tl.fromTo(aura,{opacity:.25,scale:.7},
        {opacity:1,scale:1,duration:.85,ease:'power3.out',clearProps:'opacity,transform'},.12);
      if(tier==='cap')tl.to(aura,{scale:1.08,duration:.34,repeat:1,yoyo:true,ease:'sine.inOut',clearProps:'transform'},1.05);
    }else if(bonusReveal||summary){
      const title=dialog.querySelector('#featureTitle');
      const illustration=reveal.querySelectorAll(summary?'.feature-art, .ledger-motion':'.feature-art');
      const aura=reveal.querySelector('.feature-aureole');
      revealTargets.push(title, ...illustration, aura, value);
      tl.timeScale(Math.sqrt(playbackSpeed(options())));
      tl.fromTo(title,{opacity:.55,y:8,filter:'blur(3px)'},
        {opacity:1,y:0,filter:'blur(0px)',duration:.36,ease:'power2.out',clearProps:'opacity,transform,filter'},0);
      tl.fromTo(aura,{opacity:.26,scale:.78},
        {opacity:1,scale:1,duration:.82,ease:'power3.out',clearProps:'opacity,transform'},0);
      tl.fromTo(illustration,{opacity:0,y:20,scale:.92},
        {opacity:1,y:0,scale:1,duration:.7,ease:'power3.out',clearProps:'opacity,transform'},.06);
      tl.fromTo(value,summary?{y:8,opacity:.7}:{y:12,scale:.92},
        {y:0,scale:1,opacity:1,duration:.56,ease:summary?'power2.out':'back.out(1.35)',clearProps:'opacity,transform'},.14);
    }
    if(!renderedLight&&!summary){
      if(bonusReveal||winReveal)reveal.prepend(field);
      else{
        reveal.prepend(rays);content.prepend(field);
        tl.fromTo([rays],{opacity:0,rotation:-12,scale:.7},{opacity:.22,rotation:0,scale:1,duration:.75,ease:'power2.out'},0);
      }
      if(count)tl.fromTo([...field.children],{opacity:0,y:16,scale:.3},{opacity:.6,y:-65,scale:i=>.5+(i%3)*.2,duration:2.2,stagger:{each:.025,from:'center'},repeat:1,yoyo:true,ease:'sine.inOut'},0);
    }
    let done=false;
    if(Number.isFinite(amount)&&amount>0){
      const counter={value:0};
      const duration=WIN_TIERS.find(win=>win.id===tier)?.countDuration??(tier==='cap'?3.4:.8);
      const precision=10**(finalText.match(/\.(\d+)/)?.[1].length??2);
      const amountText=document.createTextNode(format(0));value.replaceChildren(amountText);
      let lastPaint=0;
      tl.to(counter,{value:amount,duration,ease:'power2.out',onUpdate(){
        if(done)return;
        const now=win.performance.now();
        if(now-lastPaint<32)return;
        lastPaint=now;
        const text=format(Math.floor(counter.value*precision)/precision);
        if(amountText.data!==text)amountText.data=text;
      },onComplete(){amountText.data=finalText;}},winReveal?.duration*.36||.14);
    }
    const controls={finish(){
      if(done)return;
      done=true;
      if(activeCeremony===controls)activeCeremony=null;
      tl.kill();
      if(revealTargets.length)gsap.set(revealTargets,{clearProps:'opacity,transform,filter'});
      lights.clear(reveal);
      value.textContent=finalText;
      field.remove();
      rays.remove();
    }};
    activeCeremony=controls;
    return controls;
  }
  return {
    ceremony, celebrate, flashSpin, meterLights:sample => lights.meterLights(scene, sample), clearLights:() => lights.clear(),
    desktopMotion:canLight, cascadeEffect:(kind, data) => lights.cascadeEffect(scene, kind, data),
    pulse(type){if(options().reduced||document.hidden)return;pulse?.kill();pulse=gsap.fromTo([response],{opacity:0},{opacity:type==='scatter'?.6:.4,duration:.35,repeat:1,yoyo:true,ease:'sine.inOut',onComplete:()=>{pulse=null;}});},
    destroy(){
      activeCeremony?.finish();
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      media?.removeEventListener('change', sync);
      desktop?.removeEventListener('change', sync);
      priest?.removeEventListener('mascot-preview', preview);
      loop?.removeEventListener('playing', showLoop);
      loop?.removeEventListener('pause', hideLoop);
      loop?.removeEventListener('error', hideLoop);
      if (wantsLoop) loop.pause();
      scene.removeAttribute('data-cathedral-loop');
      hideLoop();
      backdrop.remove();
      scene.removeAttribute('data-feature-covered');
      pulse?.kill();
      lights.destroy();
      ambient.remove();
    }
  };
}

const clamp = number => Math.max(0, Math.min(1, number));
const light = (x,y,size,color,alpha,aspect,rotation) => ({x,y,size,color,alpha,aspect,rotation});
const crimson = 0xff5472, amber = 0xffb16b, ivory = 0xffebbb;

export function createProgressMotion({document, gsap, options, noMotion, meterLights}) {
  const win = document.defaultView;
  const scene = document.querySelector('.scene');
  const rail = scene.querySelector('.altar-rail'), ladder = document.getElementById('altarLadder');
  const track = rail.querySelector('.altar-track-fx'), offerings = document.getElementById('offerings');
  const desktop = win.matchMedia?.(DESKTOP_MOTION_QUERY);
  const enabled = () => desktop?.matches === true && Boolean(gsap?.timeline) && !noMotion();
  const shown = {earned:0, blood:0, travel:0, hit:0};
  const impacts = new Map();
  let target, altar, geometry;

  function locateVessel(element, bounds = scene.getBoundingClientRect()) {
    const glass = element.querySelector('.offering-glass').getBoundingClientRect();
    return {x:glass.left + glass.width / 2 - bounds.left, y:glass.top + glass.height / 2 - bounds.top,
      size:Math.max(20, glass.width * 1.8)};
  }

  function layout() {
    if (!desktop?.matches) return;
    const art = getArt('altar-surround'), box = artBox(art.id, rail.clientWidth, rail.clientHeight);
    if (!box) return;
    const bounds = scene.getBoundingClientRect(), frame = rail.getBoundingClientRect(), channel = track.getBoundingClientRect();
    // Register the glows to the engraved diamonds inside the source image.
    const start = box.left + box.width * .1375, end = box.left + box.width * .8625;
    const y = box.top + box.height * .505;
    rail.style.setProperty('--altar-jewel-start', `${start}px`);
    rail.style.setProperty('--altar-jewel-end', `${end}px`);
    rail.style.setProperty('--altar-jewel-y', `${y}px`);
    geometry = {x:channel.left - bounds.left, y:channel.top + channel.height / 2 - bounds.top,
      width:channel.width, scale:Math.max(.72, Math.min(1.45, bounds.width / 1440)),
      jewels:[start,end].map(x => ({x:frame.left + x - bounds.left, y:frame.top + y - bounds.top}))};
    for (const [element, impact] of impacts) impact.origin = locateVessel(element, bounds);
  }

  function sampleLights() {
    const glows = [];
    if (altar && geometry) {
      const {x:left, y, width, scale, jewels} = geometry;
      const x = left + width * shown.blood, hue = altar.rising ? amber : crimson;
      glows.push(light(x - 16*scale, y, 118*scale, hue, shown.travel*.63, .16));
      glows.push(light(x, y, 54*scale, hue, shown.travel*.63, .54));
      glows.push(light(x, y, 19*scale, ivory, shown.travel*.86, .3));
      if (altar.rising) {
        glows.push(light(left + width*shown.earned, y - 4*scale, 66*scale, amber, shown.hit*.7, .65));
        for (const jewel of jewels) {
          glows.push(light(jewel.x, jewel.y, 75*scale, amber, shown.hit*.74, .72));
          glows.push(light(jewel.x, jewel.y, 39*scale, ivory, shown.hit*.9, .15, -.28));
        }
      }
    }
    for (const {origin:{x,y,size}, progress, flash, releasing} of impacts.values()) {
      glows.push(light(x, y, size*(1.63 + progress*.66), releasing ? amber : crimson, flash*.81, 1.14));
      glows.push(light(x, y, size*.55, ivory, flash*.93, .84));
      glows.push(light(x, y, size*(.9 + progress*.8), amber, flash*.72, .13, -.31));
      for (let i=0; i<4; i++) {
        const angle = .8 + i*1.85;
        const lift = size * (.24 + progress*.62);
        const drift = size * progress * .46;
        glows.push(light(x + Math.cos(angle)*lift, y + Math.sin(angle)*lift*.61 - drift,
          size*(.12 + i*.012), i%2 ? ivory : amber, flash*(1 - progress)*.86, .55, angle));
      }
    }
    return glows;
  }

  function syncLights() {
    meterLights(altar || impacts.size ? sampleLights : null);
  }

  function renderRail() {
    rail.style.setProperty('--altar-earned-progress', shown.earned);
    rail.style.setProperty('--altar-blood-progress', shown.blood);
    rail.style.setProperty('--altar-blood-ready', target?.fraction ? '.92' : '0');
    rail.style.setProperty('--altar-travel', shown.travel);
    rail.style.setProperty('--altar-hit', shown.hit);
  }

  function stopAltar({settle = true} = {}) {
    altar?.timeline.kill();
    for (const step of altar?.steps ?? []) step.style.removeProperty('--step-light');
    altar = null;
    shown.travel = shown.hit = 0;
    if (settle && target) Object.assign(shown, {earned:target.earned, blood:target.blood});
    renderRail();
    syncLights();
  }

  function positionAltar(index, count, fraction, animate) {
    if (target?.index === index && target.count === count && target.fraction === fraction) return;
    const previous = target, earned = (index + .5) / count;
    target = {index, count, fraction, earned, blood:Math.min((count - .5) / count, earned + fraction / count)};
    if (!animate || !previous || previous.count !== count || !enabled()) return stopAltar();
    stopAltar({settle:false});
    layout();
    const rising = index > previous.index;
    const steps = rising ? [...ladder.children].slice(previous.index + 1, index + 1) : [];
    const travel = rising ? Math.min(.73, .43 + steps.length * .048) : .31;
    const timeline = gsap.timeline({paused:true, onUpdate:renderRail, onComplete:stopAltar});
    altar = {timeline, steps, rising};
    timeline.to(shown, {earned, blood:target.blood, duration:travel, ease:'power2.inOut'}, 0);
    timeline.to(shown, {travel:1, duration:.13, ease:'power2.out'}, 0)
      .to(shown, {travel:0, duration:.37, ease:'power2.out'}, travel - .04);
    if (rising) {
      timeline.to(shown, {hit:1, duration:.13, ease:'power2.out'}, travel - .07)
        .to(shown, {hit:0, duration:.66, ease:'power2.out'}, travel + .06);
      steps.forEach((step, i) => {
        const crossing = .13 + (travel - .14) * ((i + 1) / steps.length);
        timeline.to(step, {'--step-light':1, duration:.12, ease:'power2.out'}, crossing)
          .to(step, {'--step-light':0, duration:.59, ease:'power2.out'}, crossing + .12);
      });
    }
    syncLights();
    timeline.timeScale(playbackSpeed(options())).play();
  }

  function renderOfferingFloor() {
    const intensity = Math.max(0, ...[...impacts.values()].map(impact => impact.releasing ? impact.flash : 0));
    offerings.style.setProperty('--offering-surge', intensity);
  }

  function clearVessel(element) {
    const impact = impacts.get(element);
    if (!impact) return;
    impact.tween?.kill();
    impacts.delete(element);
    element.style.removeProperty('--vessel-flash');
    element.style.removeProperty('--vessel-halo');
    renderOfferingFloor();
    syncLights();
  }

  function lightVessel(element, releasing = false, delay = 0) {
    if (!enabled()) return;
    const lingering = impacts.get(element)?.flash ?? 0;
    impacts.get(element)?.tween.kill();
    const impact = {origin:locateVessel(element), flash:lingering, progress:0, releasing};
    impacts.set(element, impact);
    impact.tween = gsap.to(impact, {progress:1, delay, duration:releasing ? 1.04 : .82, ease:'none',
      onUpdate() {
        const p = impact.progress;
        impact.flash = Math.max(lingering * (1 - clamp(p*5)), clamp(p/.14) * (1 - p)**1.26);
        element.style.setProperty('--vessel-flash', impact.flash);
        element.style.setProperty('--vessel-halo', Math.max(element.classList.contains('filled') ? .64 : 0, impact.flash*.97));
        if (releasing) renderOfferingFloor();
      },
      onComplete:() => clearVessel(element)
    });
    impact.tween.timeScale(playbackSpeed(options()));
    syncLights();
  }

  function reset() {
    stopAltar();
    for (const element of impacts.keys()) clearVessel(element);
  }

  function sync() {
    if (!enabled()) reset();
    layout();
  }
  const resize = win.ResizeObserver ? new win.ResizeObserver(layout) : null;
  resize?.observe(scene);
  if (!resize) win.addEventListener('resize', layout);
  const observer = new win.MutationObserver(sync);
  observer.observe(scene, {attributes:true, attributeFilter:['class']});
  desktop?.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  layout();

  return {enabled, positionAltar, lightVessel, reset,
    setSpeed(value) {
      altar?.timeScale(value);
      for (const impact of impacts.values()) impact.tween?.timeScale(value);
    },
    releaseVessels(vessels) { vessels.forEach((element, index) => lightVessel(element, true, index*.085)); },
    destroy() {
      reset();
      resize?.disconnect();
      win.removeEventListener('resize', layout);
      desktop?.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      observer.disconnect();
    }
  };
}
