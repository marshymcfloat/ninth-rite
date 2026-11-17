import {createMascot as createStillMascot} from './mascot-still.mjs';
export {registeredMascotBox} from './mascot-still.mjs';

export function createMascot(root,{reduced,manifest={}}={}){
  const doc=root.ownerDocument,win=doc.defaultView;
  let settings=manifest,rig=null,loading=null,paused=false,destroyed=false,failed=false,activateTimer=null,speed=1,pending=false,allowed=false;
  const idleClip = root.querySelector('video[data-generated-idle]');
  const scene = root.closest('.scene');
  let anchorBounds;
  const refreshAnchor = () => { anchorBounds = null; };
  const anchorResize = idleClip && win.ResizeObserver ? new win.ResizeObserver(refreshAnchor) : null;
  anchorResize?.observe(root);
  if(scene)anchorResize?.observe(scene);
  win.addEventListener('resize',refreshAnchor);
  const stillOnly = () => new URLSearchParams(win.location.search).get('motion') === 'still';
  const canUseClip = () => Boolean(idleClip) && !stillOnly();
  const still = createStillMascot(root, {
    reduced, manifest,
    idleEnabled: idleClip ? () => allowed && canUseClip() : undefined,
    useGeneratedProfile: Boolean(idleClip),
  });
  const abort=new AbortController();
  const blocked=()=>paused||reduced?.matches||doc.hidden;
  const useRig=()=>!!rig&&!blocked()&&!failed;
  const canRig=()=>settings.mascot?.rig?.enabled&&!failed&&!!win.WebGL2RenderingContext&&!stillOnly()&&!idleClip;
  function reveal(){
    if(destroyed||!rig||blocked()||!canRig())return;
    if(still.reaction!=='idle'){activateTimer=win.setTimeout(reveal,80);return;}
    still.cancel({resumeIdle:false});root.classList.add('has-rig');root.dataset.renderer='pixi-rig';
    rig.motion.speed=speed;rig.motion.setPending(pending);rig.start();
  }
  async function load(){
    const spec=settings.mascot?.rig;
    if(!allowed||loading||rig||destroyed||blocked()||!canRig())return loading;
    loading=(async()=>{
      try{
        const {createPriestRig}=await import('./mascot-rig.mjs');
        const timer=win.setTimeout(()=>abort.abort(),20000);
        try{rig=await createPriestRig(root,{url:spec.url,gsap:win.gsap,signal:abort.signal});}finally{win.clearTimeout(timer);}
        if(destroyed||abort.signal.aborted){rig.destroy();rig=null;return;}reveal();
      }catch(error){if(!destroyed){failed=true;root.dataset.renderer='still';root.dataset.rigError=error.message;}}
    })();
    return loading;
  }
  function configure(value){settings=value;still.configure(value);}
  function prepare(name){
    const first = !allowed;
    allowed = true;
    if (canUseClip() && first) still.resume();
    if(!canRig()||reduced?.matches)return still.prepare(name);
    load();
    return null;
  }
  function react(name,options){
    if(destroyed||paused||doc.hidden)return false;
    if(useRig()&&root.classList.contains('has-rig'))return rig.react(name,options);
    if (canUseClip()) {
      if (name === 'spin') return false;
      if (name === 'offering') {
        still.highlight();
        return false;
      }
      if (name === 'celebration' && !settings.mascot?.generated?.reactions?.celebration) return still.react('benediction', options);
    }
    return still.react(name,options);
  }
  function cancel(options={}){
    win.clearTimeout(activateTimer);still.cancel(options);pending=false;
    rig?.cancel({hard:true});if(options.resetKeys)rig?.motion.beginRound();
    if(blocked()||options.resumeIdle===false)rig?.stop();else if(root.classList.contains('has-rig'))rig?.start();
  }
  function setPaused(value){
    paused=!!value;still.setPaused(value);
    if(blocked()){rig?.stop();rig?.cancel();root.classList.remove('has-rig');}
    else{if(rig)reveal();else load();}
  }
  function visibility(){
    if(doc.hidden){rig?.stop();rig?.cancel();pending=false;}
    else if(!blocked()){if(rig)reveal();else load();}
  }
  function motionChange(){setPaused(paused);}
  function contextLost(){failed=true;root.classList.remove('has-rig');root.dataset.renderer='still';rig?.destroy();rig=null;}
  doc.addEventListener('visibilitychange',visibility);reduced?.addEventListener('change',motionChange);root.addEventListener('riglost',contextLost);
  // The still controller's preview listener is suppressed once the rig is active.
  function preview(event){if(root.classList.contains('has-rig')){event.stopImmediatePropagation();if(!rig.motion.current)react('invocation',{priority:0,key:'preview:'+rig.motion.time});}}
  root.addEventListener('click',preview,true);
  return {
    configure,prepare,react,cancel,setPaused,setCovered:still.setCovered,
    beginRound(){still.beginRound();rig?.motion.beginRound();},
    settle(){still.settle();rig?.motion.settle();},
    highlight(options){if(useRig())rig.react('win',options);else still.highlight();},
    setPending(value){pending=!!value;rig?.motion.setPending(pending);},
    setSpeed(value){speed=[1,2,4].includes(value)?value:1;if(rig)rig.motion.speed=speed;},
    clipTime(name){return still.clipReaction === name ? still.clipTime : null;},
    getAnchor(name,relativeTo=scene){
      if (root.classList.contains('has-rig')) return rig?.anchor(name, relativeTo);
      const profile = idleClip && settings.mascot?.generated;
      const vessel = profile?.vessel;
      if (name !== 'vessel' || !vessel) return null;
      const measure = () => ({box:root.getBoundingClientRect(),relative:relativeTo?.getBoundingClientRect() ?? {left:0,top:0}});
      const {box,relative} = scene && relativeTo===scene ? (anchorBounds ??= measure()) : measure();
      const height = Math.min(box.height, box.width * 8 / 5);
      const width = height * 5 / 8;
      const path = profile.reactions?.[still.clipReaction]?.vesselPath;
      let [x, y] = vessel.idle;
      if (path?.length) {
        const time = still.clipTime;
        const index = path.findIndex(frame => frame[0] >= time);
        const to = path[index < 0 ? path.length - 1 : index];
        const from = path[Math.max(0, index - 1)];
        const progress = to[0] === from[0] ? 0 : Math.min(1, (time - from[0]) / (to[0] - from[0]));
        x = from[1] + (to[1] - from[1]) * progress;
        y = from[2] + (to[2] - from[2]) * progress;
      }
      return {
        x: box.left - relative.left + (box.width - width) / 2 + width * x,
        y: box.top - relative.top + (box.height - height) / 2 + height * y,
      };
    },
    get reaction(){return useRig()&&root.classList.contains('has-rig')?rig.motion.current?.name||'idle':still.reaction;},
    inspect(){return rig?rig.inspect():{renderer:'still',failed,loading:!!loading};},
    ready(){allowed=true;return load();},
    reviewPose(values){return win.location.pathname.endsWith('/rig-review.html')?rig?.reviewPose(values):null;},
    reviewMasks(groups){return win.location.pathname.endsWith('/rig-review.html')?rig?.reviewMasks(groups):null;},
    reviewFrame(name,seconds=0){
      if(!rig||!win.location.pathname.endsWith('/rig-review.html'))return null;
      rig.stop();rig.motion.cancel();rig.motion.time=0;rig.motion.blinkAt=3.3;rig.motion.blinkEnd=0;
      if(name!=='idle')rig.react(name,{key:'frame:'+rig.motion.count,priority:10});
      for(let t=0;t<seconds;t+=1/120)rig.motion.advance(Math.min(1/120,seconds-t));rig.draw();return rig.inspect();
    },
    destroy(){
      if(destroyed)return;destroyed=true;abort.abort();win.clearTimeout(activateTimer);rig?.destroy();still.destroy();
      anchorResize?.disconnect();win.removeEventListener('resize',refreshAnchor);
      doc.removeEventListener('visibilitychange',visibility);reduced?.removeEventListener('change',motionChange);root.removeEventListener('riglost',contextLost);root.removeEventListener('click',preview,true);
      root.classList.remove('has-rig');
    }
  };
}

