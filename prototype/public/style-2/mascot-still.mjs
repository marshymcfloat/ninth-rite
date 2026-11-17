const aliases={invoke:'invocation',confirmed:'benediction',expired:'expiry'};
const priorities={invocation:3,benediction:4,expiry:4,bonus:2,altar:1,celebration:2};
const idleSegmentSeconds = 4;
const idleChoices = [0, 0, 0, 0, 1, 2, 3, 4];
const segmentStartupTimeout = 7000;
const segmentStallTimeout = 3600;

export function registeredMascotBox(width,height,reference,asset){
  const fit=Math.min(width/reference.canvas[0],height/reference.canvas[1]);
  const scale=(reference.footY-reference.headY)/(asset.footY-asset.headY);
  return {
    width:asset.canvas[0]*fit*scale,height:asset.canvas[1]*fit*scale,
    left:(width-reference.canvas[0]*fit)/2+(reference.footX-asset.footX*scale+(asset.offsetX||0))*fit,
    top:(height-reference.canvas[1]*fit)/2+(reference.footY-asset.footY*scale)*fit,
  };
}

export function createMascot(root,{reduced,manifest={},idleEnabled,useGeneratedProfile}={}){
  const document=root.ownerDocument,window=document.defaultView,idle=root.querySelector('video'),poster=root.querySelector('.mascot-poster');
  const pose=document.createElement('img');pose.className='mascot-reaction-pose';pose.alt='';pose.setAttribute('aria-hidden','true');root.append(pose);
  let settings=manifest.mascot||{},paused=false,covered=false,booted=false,idleLoaded=false,idleFailed=false,idleAlpha=false,serial=0,current=null,timer,highlightTimer;
  const variedIdle = idle?.hasAttribute('data-generated-idle');
  let idleSegment = 0;
  let videoFrame = null;
  const clips=new Map(),seen=new Set(),posters=new Map();
  let poseRegistration;
  function register(element,registration){
    const reference=settings.registration?.idle;
    if(!element||!reference||!registration)return;
    const box=registeredMascotBox(root.clientWidth,root.clientHeight,reference,registration);
    element.style.inset='auto';
    for(const [property,value] of Object.entries(box))element.style[property]=`${value}px`;
  }
  function layout(){
    register(poster,settings.registration?.idle);
    register(pose,poseRegistration);
    for(const record of clips.values())register(record.video,record.registration);
  }
  const resize=window.ResizeObserver?new window.ResizeObserver(layout):null;
  resize?.observe(root);if(!resize)window.addEventListener('resize',layout);
  const stopped=()=>paused||covered||reduced?.matches||document.hidden;
  const canUseIdle = () => idleEnabled ? idleEnabled() : settings.videoEnabled !== false;
  const safePause=video=>{try{video?.pause();}catch{}};
  const hasFootage = () => idle?.duration >= (settings.footage?.duration ?? 20) - .05;
  function advanceIdle(position) {
    if (idle.paused || idle.seeking || stopped() || !canUseIdle() || !hasFootage()) return;
    if (Math.abs(position - idle.currentTime) > .6) return;
    if (current?.segment) {
      const [start, end] = current.segment;
      if (position >= end - .26 || (position < start - .05 && current.lastClipFrame !== undefined)) {
        cancel();
      } else if (position >= start - .05) {
        current.lastClipFrame = position;
      }
      return;
    }
    if (current) return;
    const idleSegments = settings.footage?.idleSegments;
    const [start, end] = idleSegments?.[idleSegment] ?? [idleSegment * idleSegmentSeconds, (idleSegment + 1) * idleSegmentSeconds];
    if (position >= start - .02 && position < end - .26) return;
    const choices = settings.footage?.idleChoices ?? idleChoices;
    idleSegment = idleSegment === 0 && position >= start
      ? choices[Math.floor(Math.random() * choices.length)]
      : 0;
    idle.currentTime = idleSegments?.[idleSegment]?.[0] ?? idleSegment * idleSegmentSeconds;
  }

  function watchFrames() {
    if (!variedIdle || !idle.requestVideoFrameCallback || videoFrame !== null || idle.paused || stopped()) return;
    videoFrame = idle.requestVideoFrameCallback((_time, frame) => {
      videoFrame = null;
      advanceIdle(frame.mediaTime);
      watchFrames();
    });
  }
  function stopFrames() {
    if (videoFrame === null) return;
    idle.cancelVideoFrameCallback(videoFrame);
    videoFrame = null;
  }
  const updateTime = () => advanceIdle(idle.currentTime);
  function alpha(video){
    if(video.readyState<2)return false;
    try{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,1,1,1,1,0,0,1,1);
      return ctx.getImageData(0,0,1,1).data[3]<32;
    }catch{return false;}
  }
  function configure(value){
    const base = value?.mascot || value || {};
    const generated = useGeneratedProfile ? base.generated : null;
    settings = generated ? {...base, ...generated} : base;
    root.toggleAttribute('data-generated-mascot', Boolean(generated));
    root.style.setProperty('--reaction-blend',(settings.blendMs||140)+'ms');
    if(poster&&settings.idlePoster)poster.src=settings.idlePoster;
    if(!canUseIdle()){safePause(idle);idle?.removeAttribute('src');idleLoaded=false;idleSegment=0;root.classList.remove('is-playing');}
    layout();
  }
  configure(manifest);
  function hideReaction(){
    pose.classList.remove('is-visible');
    for(const record of clips.values()){record.video.classList.remove('is-visible');safePause(record.video);}
    root.classList.remove('is-reacting');delete root.dataset.reaction;
  }
  async function resume({matching=false}={}){
    const id=serial;
    if(!idle||!canUseIdle()||current||stopped()||idleFailed||!booted){safePause(idle);root.classList.remove('is-playing');return;}
    if(!idleLoaded){idleLoaded=true;idle.src=idle.dataset.src;idle.load();}
    if(matching){
      idleSegment = 0;
      try{idle.currentTime=0;}catch{}
    }
    try{await idle.play();if(id!==serial||current||stopped())return;
      idleAlpha=(!settings.footage||hasFootage())&&(idleAlpha||alpha(idle));if(idleAlpha){root.classList.add('is-playing');watchFrames();}
      else{idleFailed=true;safePause(idle);root.classList.remove('is-playing');}
    }catch{if(id===serial)root.classList.remove('is-playing');}
  }
  function cancel({resetKeys=false,resumeIdle=true,keepIdle=false}={}){
    const hadReaction=!!current;
    serial++;clearTimeout(timer);clearTimeout(highlightTimer);root.classList.remove('vessel-highlight');current=null;hideReaction();if(resetKeys)seen.clear();
    if(resumeIdle)resume({matching:hadReaction});
    else if(!keepIdle){safePause(idle);root.classList.remove('is-playing');}
  }
  function prepare(name){
    const spec=settings.reactions?.[name]||settings.reactions?.[name==='altar'?'benediction':name];
    if(!spec)return null;
    if(spec.poster&&!posters.has(spec.poster)){const image=new window.Image();image.src=spec.poster;posters.set(spec.poster,image);}
    if(settings.videoEnabled===false||!spec.src||clips.has(spec.src))return {spec,record:clips.get(spec.src)};
    const video=document.createElement('video');video.className='mascot-reaction-video';video.muted=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-hidden','true');
    const record={video,ready:false,failed:false,registration:spec.registration?.video};clips.set(spec.src,record);root.append(video);register(video,record.registration);
    video.addEventListener('loadeddata',()=>{record.ready=alpha(video);record.failed=!record.ready;});
    video.addEventListener('error',()=>{record.failed=true;record.ready=false;if(current?.video===video)fallback(current.name,current.spec);});
    video.addEventListener('ended',()=>{if(current?.video===video)cancel();});
    video.src=spec.src;video.load();return {spec,record};
  }
  function fallback(name,spec){
    if(current?.video){safePause(current.video);current.video.classList.remove('is-visible');current.video=null;}
    const id=serial,show=()=>{if(id!==serial||current?.name!==name)return;poseRegistration=spec.registration?.poster;register(pose,poseRegistration);pose.src=spec.poster;pose.classList.add('is-visible');root.classList.add('is-reacting');};
    const image=posters.get(spec.poster);
    if(image?.complete&&image.naturalWidth)show();
    else if(image)image.addEventListener('load',show,{once:true});
  }
  function playSegment(name, spec, id) {
    const [start] = spec.segment;
    const usePoster = () => {
      if (serial !== id || covered) return;
      current.segment = null;
      safePause(idle);
      root.classList.remove('is-playing');
      fallback(name, spec);
      clearTimeout(timer);
      timer = setTimeout(() => { if (serial === id) cancel(); }, spec.durationMs ?? 1400);
    };
    function checkProgress(previousFrame) {
      if (serial !== id) return;
      const frame = current.lastClipFrame;
      if (!covered && frame === previousFrame) usePoster();
      else timer = setTimeout(() => checkProgress(frame), segmentStallTimeout);
    }
    try {
      idle.currentTime = start;
      current.segment = spec.segment;
      const playback=idle.paused ? idle.play() : undefined;
      Promise.resolve(playback).then(() => {
        if (serial === id && !stopped()) {
          root.classList.add('is-playing');
          watchFrames();
        }
      }).catch(usePoster);
      timer = setTimeout(checkProgress, segmentStartupTimeout);
      return true;
    } catch {
      current.segment = null;
      return false;
    }
  }
  function react(raw='invocation',{key,priority}={}){
    const name=aliases[raw]||raw,p=priority??priorities[name]??0;
    if(document.hidden||paused||(key&&seen.has(key))||(current&&p<current.priority))return false;
    if(current?.name===name&&!key)return false;
    if(key){seen.add(key);if(seen.size>128)seen.delete(seen.values().next().value);}
    const prepared=prepare(name),spec=prepared?.spec||{};
    const inVideo=Boolean(variedIdle&&spec.segment&&idleAlpha&&hasFootage()&&!stopped()&&canUseIdle());
    cancel({resumeIdle:false,keepIdle:inVideo});const id=serial;
    current={name,priority:p,spec,video:null};root.dataset.reaction=name;
    if(inVideo&&playSegment(name,spec,id))return true;
    safePause(idle);
    root.classList.remove('is-playing');
    // Downloads never delay or restart a reaction already represented by its pose.
    const record=prepared?.record;
    if(!stopped()&&record?.ready&&!record.failed){
      try{record.video.currentTime=0;current.video=record.video;
        Promise.resolve(record.video.play()).then(()=>{
          if(serial!==id||stopped()){safePause(record.video);return;}
          pose.classList.remove('is-visible');record.video.classList.add('is-visible');root.classList.add('is-reacting');
          // Let media completion own the return to idle; startup buffering must not
          // consume the reaction's four seconds. This timeout is only a stall guard.
          clearTimeout(timer);timer=setTimeout(()=>{if(serial===id)cancel();},(spec.durationMs||4050)+2000);
        }).catch(()=>{if(serial===id)fallback(name,spec);});
      }catch{fallback(name,spec);}
    }else fallback(name,spec);
    timer=setTimeout(()=>{if(serial===id)cancel();},stopped()?650:spec.durationMs||1800);
    return true;
  }
  function setPaused(value){paused=value;root.classList.toggle('is-paused',value||reduced?.matches);cancel();}
  function setCovered(value){
    if(!variedIdle||covered===value)return;
    covered=value;
    if(covered){safePause(idle);stopFrames();return;}
    if(stopped())return;
    if(current?.segment){
      const id=serial;
      Promise.resolve(idle.play()).then(watchFrames).catch(()=>{if(serial===id&&!covered)cancel();});
    }else resume();
  }
  function playing() {
    if (canUseIdle() && !current && !stopped() && (!settings.footage || hasFootage())) {
      idleAlpha=idleAlpha||alpha(idle);
      if(idleAlpha)root.classList.add('is-playing');
    }
    watchFrames();
  }
  function idleError() {
    idleFailed = true;
    root.classList.remove('is-playing');
    stopFrames();
  }
  idle?.addEventListener('playing', playing);
  idle?.addEventListener('pause', stopFrames);
  idle?.addEventListener('error', idleError);
  if (variedIdle && !idle.requestVideoFrameCallback) idle.addEventListener('timeupdate', updateTime);
  const visibility=()=>document.hidden?cancel({resumeIdle:false}):resume();
  const motion=()=>setPaused(paused);
  document.addEventListener('visibilitychange',visibility);reduced?.addEventListener('change',motion);
  function preview() {
    if (!current && react('invocation', {priority:0})) root.dispatchEvent(new window.CustomEvent('mascot-preview'));
  }
  root.addEventListener('click', preview);
  const boot=()=>{booted=true;resume();};
  if(document.readyState==='complete')setTimeout(boot,0);else window.addEventListener('load',boot,{once:true});
  return {react,setPaused,setCovered,cancel,configure,prepare,resume,beginRound(){seen.clear();},settle(){if(current?.name==='invocation')current.priority=4;},highlight(){if(stopped()||current)return;clearTimeout(highlightTimer);root.classList.add('vessel-highlight');highlightTimer=setTimeout(()=>root.classList.remove('vessel-highlight'),550);},get reaction(){return current?.name||'idle';},
    get clipReaction(){return current?.segment ? current.name : null;},
    get clipTime(){return current?.segment && current.lastClipFrame !== undefined ? Math.max(0, current.lastClipFrame - current.segment[0]) : 0;},
    destroy(){
      cancel({resumeIdle:false});safePause(idle);stopFrames();
      idle?.removeEventListener('timeupdate',updateTime);
      idle?.removeEventListener('playing',playing);
      idle?.removeEventListener('pause',stopFrames);
      idle?.removeEventListener('error',idleError);
      root.removeEventListener('click',preview);
      resize?.disconnect();window.removeEventListener('resize',layout);document.removeEventListener('visibilitychange',visibility);reduced?.removeEventListener('change',motion);
      for(const {video} of clips.values()){video.removeAttribute('src');video.load();video.remove();}
      pose.remove();
    }};
}

