import {bonusCounterText} from '../bonus-counter.mjs';
import {roundCelebration} from '../ceremony.mjs';
import {COLLECTION_FLIGHT_TIME,COLLECTION_LANDING_TIME,SYMBOL_POP_TIME,collectionHead,createCollectionCanvas,streamPoint} from './collection-fx.mjs';
import {createIntervention} from './intervention.mjs';
import {createProgressMotion,createSceneMotion,playbackSpeed} from './scene-motion.mjs';
import {artUrl,symbolArtId,applyArt,artBox,getArt,ALTAR_TIERS} from './art.mjs';

export const SYMBOL_NAMES={C1:'Jack',C2:'Queen',C3:'King',C4:'Ace',P1:'Blood chalice',P2:'Horned crown',P3:'Bound eye',P4:'Reliquary',S:'Hollow Halo scatter'};
export function celebrationAmountBox(id,width,height){
  const box=artBox(id,width,height,.98),area=getArt(id)?.amountSafeRect;
  if(!box||!area||id==='win-cap')return null;
  return {left:box.left+area[0]*box.scale,top:box.top+area[1]*box.scale,width:area[2]*box.scale,height:area[3]*box.scale};
}
export function clusterAwardPositions(clusters,sizes=[]){
  const placed=[];
  return clusters.map((cluster,index)=>{
    const cells=cluster.positions.map(p=>({x:p%6+.5,y:Math.floor(p/6)+.5}));
    const center={x:cells.reduce((sum,p)=>sum+p.x,0)/cells.length,y:cells.reduce((sum,p)=>sum+p.y,0)/cells.length};
    const width=Math.min(sizes[index]?.width||1.4,5.8),height=Math.min(sizes[index]?.height||.55,4.7);
    const candidates=[...cells];
    if(cluster.positions.includes(Math.floor(center.y)*6+Math.floor(center.x)))candidates.unshift(center);
    const ranked=candidates.map(p=>{
      const x=Math.max(width/2+.06,Math.min(6-width/2-.06,p.x)),y=Math.max(height/2+.12,Math.min(5-height/2-.12,p.y));
      const overlap=placed.reduce((sum,b)=>sum+Math.max(0,(width+b.width)/2+.12-Math.abs(x-b.x))*Math.max(0,(height+b.height)/2+.12-Math.abs(y-b.y)),0);
      return {x,y,width,height,score:overlap*1000+(x-center.x)**2+(y-center.y)**2};
    }).sort((a,b)=>a.score-b.score);
    const best=ranked[0];placed.push(best);return {x:best.x/6*100,y:best.y/5*100};
  });
}
export function createPresentation({document,gsap,config,mascot,options,format,manifest={},sound}) {
  const $=id=>document.getElementById(id),active=new Set();
  const awards=document.createElement('div');awards.className='cluster-awards';$('grid').after(awards);
  const collectionLayer=document.createElement('div');collectionLayer.className='collection-layer';collectionLayer.setAttribute('aria-hidden','true');document.querySelector('.scene').append(collectionLayer);
  const bloodstream=createCollectionCanvas(document,collectionLayer);
  function relicIcon(asset='offering-mark'){
    const img=document.createElement('img');img.src=artUrl(asset);img.alt='';img.draggable=false;return img;
  }
  let skipped=false,instant=false,dialogDone=null,featureMode=null,replaying=false,dialogClosing=false,bonusAwakened=false,capReached=false,dialogLayoutCleanup=null,dialogMotion=null;
  const life=createSceneMotion({document,gsap,options,mascot});
  const quick=()=>instant||skipped||document.hidden;
  const noMotion=()=>quick()||options().reduced||!gsap;
  const speed=()=>playbackSpeed(options());
  const message=text=>{$('sceneMessage').textContent=text;};
  const meters=createProgressMotion({document,gsap,options,noMotion,meterLights:life.meterLights});
  const intervention=createIntervention({document,mascot,animate,quick,noMotion,readouts,manifest,meters,life});
  function environment(mode){
    const name=mode==='god'?'god':['lesser','blood','greater'].includes(mode)?'bonus':'base',scene=document.querySelector('.scene');
    scene.dataset.environment=name;scene.style.setProperty('--environment-image',`url("${artUrl(`environment-${name}`)}")`);
  }
  function finishDialog(){
    dialogMotion?.finish();dialogMotion=null;
    dialogLayoutCleanup?.();dialogLayoutCleanup=null;
    if($('featureDialog').open)$('featureDialog').close();
    $('featureDialog').classList.remove('is-leaving');dialogClosing=false;
    const done=dialogDone;dialogDone=null;done?.();
  }
  function dismissDialog(){
    if(dialogClosing||!dialogDone)return;
    dialogMotion?.finish();dialogMotion=null;
    if(noMotion()){finishDialog();return;}
    dialogClosing=true;$('featureDialog').classList.add('is-leaving');
    const content=$('featureContent');gsap.killTweensOf(content);
    let tween;const done=()=>{active.delete(tween);content.removeAttribute('style');finishDialog();};
    tween=gsap.to(content,{opacity:0,y:-10,scale:1.015,duration:.26,ease:'power1.in',onComplete:done,onInterrupt:done});
    active.add(tween.timeScale(speed()));
  }
  function skip(){skipped=true;meters.reset();life.clearLights();intervention.reset();mascot.cancel?.();for(const animation of [...active])animation.totalProgress(1);finishDialog();}
  $('featureContinue').addEventListener('click',dismissDialog);
  $('featureSkip').addEventListener('click',skip);
  const cancelDialog=e=>{e.preventDefault();dismissDialog();},visibility=()=>{if(document.hidden)skip();};
  $('featureDialog').addEventListener('cancel',cancelDialog);
  document.addEventListener('visibilitychange',visibility);
  async function wait(ms){
    if(quick())return;
    let remaining=ms,last=Date.now();
    await new Promise(resolve=>{
      const timer=setInterval(()=>{
        const now=Date.now();
        remaining-=(now-last)*speed();
        last=now;
        if(quick()||remaining<=0){clearInterval(timer);resolve();}
      },20);
    });
  }
  async function waitForPriestPose(name, seconds) {
    const until = Date.now() + 1800 / Math.sqrt(speed());
    let position = mascot.clipTime?.(name);
    while (position != null && position < seconds && Date.now() < until && !noMotion()) {
      await wait(50);
      position = mascot.clipTime?.(name);
    }
  }
  function animate(nodes,from,to){
    if(noMotion()||!nodes.length)return Promise.resolve();
    return new Promise(resolve=>{
      let tween;
      const done=()=>{active.delete(tween);resolve();};
      tween=gsap.fromTo(nodes,from,{...to,onComplete:done,onInterrupt:done});
      active.add(tween.timeScale(speed()));
    });
  }
  function cell(item){
    const el=document.createElement('div');el.className='cell';el.dataset.symbol=item.symbol;
    const token=document.createElement('div');token.className='symbol-token';el.append(token);
    const id=symbolArtId(item.symbol);
    if(id){
      const img=document.createElement('img');img.className='symbol-image';img.alt='';img.draggable=false;token.append(img);
      applyArt(img,id,{occupancy:item.symbol==='S'?.94:.87,container:token});
    }else{
      const sprite=document.createElement('span');sprite.className='symbol-fallback';sprite.textContent=SYMBOL_NAMES[item.symbol]||'Unknown symbol';token.append(sprite);
    }
    if(item.symbol==='S'){const label=document.createElement('span');label.className='scatter-label';label.textContent='SCATTER';token.append(label);}
    if(item.marked){const mark=document.createElement('i');mark.className='mark';mark.setAttribute('aria-hidden','true');const icon=relicIcon();mark.append(icon);token.append(mark);applyArt(icon,'offering-mark',{container:mark});el.classList.add('offering-marked');}
    return el;
  }
  async function board(next,moves=null,{still=false}={}){
    const grid=$('grid'),previous=[...grid.children],nodes=next.flat().map(cell);
    const ordered=moves?[...moves].sort((a,b)=>a.to-b.to):null;
    const moving=!still&&!noMotion();
    grid.classList.toggle('in-motion',moving);
    try{
      if(moving&&!ordered&&previous.length){
        previous.forEach(el=>el.classList.remove('winning','orphan'));
        const outgoing=previous.map(el=>el.querySelector('.symbol-token')).filter(Boolean);
        await animate(outgoing,{yPercent:0},{yPercent:620,duration:.34,
          stagger:i=>(i%6)*.025+(4-Math.floor(i/6))*.012,ease:'power2.in'});
      }
      // Reparent the same survivor artwork, preserving its mark and decoded image.
      if(ordered)for(const move of ordered){
        if(move.from!==null){const token=previous[move.from]?.querySelector('.symbol-token');if(token)nodes[move.to].replaceChildren(token);}
      }
      grid.replaceChildren(...nodes);
      grid.setAttribute('aria-label',next.flat().map(c=>`${SYMBOL_NAMES[c.symbol]}${c.marked?', marked Offering':''}`).join('; '));
      if(!moving||noMotion())return;
      const falling=nodes.map((el,i)=>({token:el.firstElementChild,index:i,distance:ordered?ordered[i].distance:5,entering:ordered?ordered[i].entering:true})).filter(item=>item.distance>0);
      await Promise.all(Array.from({length:6},async(_,column)=>{
        const group=falling.filter(item=>item.index%6===column),tokens=group.map(item=>item.token);
        await animate(tokens,{yPercent:i=>-100*group[i].distance,opacity:1},
          {yPercent:0,duration:ordered ? .34 : .46,delay:column*.024,ease:'power2.in',clearProps:'transform,opacity'});
        await animate(tokens,{scaleX:1.04,scaleY:.93,transformOrigin:'50% 100%'},
          {scaleX:1,scaleY:1,duration:.16,ease:'power2.out',clearProps:'transform,transformOrigin'});
      }));
    }finally{
      grid.classList.remove('in-motion');
      for(const node of nodes)node.querySelector('.symbol-token')?.removeAttribute('style');
    }
  }
  async function animateDesktopClear(nodes, event) {
    const bounds = document.querySelector('.scene').getBoundingClientRect();
    function frame(position, delay, orphan) {
      const node = nodes[position], box = node.getBoundingClientRect();
      return {token:node.querySelector('.symbol-token'), x:box.left+box.width/2-bounds.left, y:box.top+box.height/2-bounds.top,
        size:Math.min(box.width,box.height)*.36, delay, orphan, seed:position};
    }
    const symbols = event.clusters.flatMap(cluster => {
      const count = cluster.positions.length;
      const column = cluster.positions.reduce((total,p)=>total+p%6,0)/count;
      const row = cluster.positions.reduce((total,p)=>total+Math.floor(p/6),0)/count;
      return cluster.positions.map(p => frame(p, Math.min(.082, Math.hypot(p%6-column,Math.floor(p/6)-row)*.029), false));
    });
    event.orphanPositions.forEach((position,index)=>symbols.push(frame(position,.097 + Math.min(index*.018,.09),true)));
    const clock = {time:0}, duration = .67;
    const effect = life.cascadeEffect('symbols', {symbols, clock});
    const grid=$('grid');
    grid.classList.add('cascade-clear');
    grid.classList.toggle('pixi-clear',Boolean(effect));
    try {
      const recoil=.075, clearTime=.15, orphanFade=.405;
      const limit=gsap.utils.clamp(0,1);
      const render=()=>{
        if(noMotion())return;
        for (const {token, delay, orphan} of symbols) {
          const age=clock.time-delay;
          if(age<=0||token.style.opacity==='0')continue;
          if (orphan) {
            const progress=limit(age/orphanFade);
            token.style.transform=`translateY(${-22*progress}%) scale(${1-.19*progress})`;
            token.style.opacity=String((1-progress)**1.5);
            continue;
          }
          const compression=limit(age/recoil)**3;
          const burst=1-(1-limit((age-recoil)/(SYMBOL_POP_TIME-recoil)))**4;
          const exit=1-(1-limit((age-SYMBOL_POP_TIME)/clearTime))**3;
          token.style.transform=`scale(${1-.06*compression+.25*burst+.16*exit},${1-.10*compression+.25*burst+.20*exit})`;
          token.style.opacity=String(1-exit);
          if(!effect&&burst>0)token.style.setProperty('--pop-light',.86*burst);
        }
      };
      await animate([clock],{time:0},{time:duration,duration,ease:'none',onUpdate:render});
    } finally { effect?.clear(); }
  }

  async function clearSymbols(nodes,event,desktop){
    const grid=$('grid'),sparks=[];
    grid.classList.add('in-motion');
    try{
      if(desktop&&!noMotion()){
        await animateDesktopClear(nodes,event);
        return;
      }
      if(!noMotion())for(const cluster of event.clusters)for(const position of cluster.positions)for(let n=0;n<3;n++){
        const spark=document.createElement('i');spark.className='rite-spark';spark.setAttribute('aria-hidden','true');nodes[position].append(spark);sparks.push(spark);
      }
      const tokens=event.clearPositions.map(p=>nodes[p].querySelector('.symbol-token'));
      await Promise.all([
        animate(tokens,{opacity:1,scale:1},{opacity:0,scale:.42,yPercent:-8,duration:.24,stagger:.008,ease:'power2.in'}),
        animate(sparks,{opacity:.9,scale:1,x:0,y:0},{opacity:0,scale:.1,x:i=>[-22,4,24][i%3],y:i=>[-24,-38,-17][i%3],rotation:i=>i%2?100:-100,duration:.38,ease:'power2.out'})
      ]);
    }finally{
      sparks.forEach(el=>el.remove());
      event.clearPositions.forEach(p=>{
        const token=nodes[p].querySelector('.symbol-token');
        token.removeAttribute('style');token.style.opacity='0';nodes[p].classList.remove('winning','orphan');
      });
      grid.classList.remove('in-motion','cascade-clear','pixi-clear');
    }
  }
  function symbolEffects(nodes,ritual=false){
    const measured=nodes.map(el=>{
      const token=el.querySelector('.symbol-token'),img=token.querySelector('img');
      const box=img?artBox(symbolArtId(el.dataset.symbol),token.clientWidth,token.clientHeight,el.dataset.symbol==='S'?.94:.87):null;
      return {token,img,box};
    });
    return measured.map(({token,img,box})=>{
      const halo=document.createElement('i');halo.className=ritual?'symbol-halo ritual-halo':'symbol-halo';
      const light=document.createElement('i');light.className='relic-light';
      const gleam=document.createElement('span');gleam.className='symbol-gleam';
      if(img){
        gleam.style.maskImage=`url("${img.src}")`;gleam.style.webkitMaskImage=`url("${img.src}")`;
        if(box)Object.assign(gleam.style,{inset:'auto',left:`${box.left}px`,top:`${box.top}px`,width:`${box.width}px`,height:`${box.height}px`,maskSize:'100% 100%',webkitMaskSize:'100% 100%'});
      }
      const sweep=document.createElement('i');gleam.append(sweep);
      for(const part of [halo,light,gleam]){part.setAttribute('aria-hidden','true');token.append(part);}
      return {halo,light,sweep,remove(){halo.remove();light.remove();gleam.remove();token.removeAttribute('style');}};
    });
  }
  function highlightSymbols(nodes,{desktop, ritual=false}){
    const grid=$('grid');
    const tokens=nodes.map(node=>node.querySelector('.symbol-token'));
    if(noMotion())return {tokens,play:()=>Promise.resolve(),clear(){}};
    if(!desktop){
      const effects=symbolEffects(nodes,ritual);
      const haloMotion=ritual
        ? [{scale:.55,rotation:-24,opacity:0},{scale:1.22,rotation:20,opacity:.9,duration:.7,stagger:.07,ease:'power2.out'}]
        : [{scale:.65,opacity:0},{scale:1.12,opacity:.75,duration:.42,ease:'power2.out'}];
      const lightMotion=ritual
        ? [{scale:.4,opacity:0},{scale:1.4,opacity:.9,duration:.6,stagger:.08,ease:'sine.out'}]
        : [{scale:.6,opacity:0},{scale:1.15,opacity:.85,duration:.29,repeat:1,yoyo:true,ease:'sine.inOut'}];
      return {tokens,
        play:()=>Promise.all([
          animate(effects.map(e=>e.halo),...haloMotion),
          animate(effects.map(e=>e.light),...lightMotion),
          animate(effects.map(e=>e.sweep),{xPercent:-160},{xPercent:160,duration:ritual ? .7 : .5,stagger:ritual ? .08 : 0,ease:'power1.inOut'})
        ]),clear:()=>effects.forEach(effect=>effect.remove())};
    }
    const bounds=document.querySelector('.scene').getBoundingClientRect();
    const count=Math.min(nodes.length,7),symbols=[];
    for(let i=0;i<count;i++){
      const box=nodes[Math.floor(i*nodes.length/count)].getBoundingClientRect();
      symbols.push({x:box.left+box.width/2-bounds.left,y:box.top+box.height/2-bounds.top,size:Math.min(box.width,box.height)*.4});
    }
    const clock={time:0},duration=ritual ? .72 : .58;
    const effect=life.cascadeEffect('highlight',{symbols,clock,ritual});
    grid.classList.toggle('pixi-focus',Boolean(effect));
    return {tokens,play:()=>animate([clock],{time:0},{time:duration,duration,ease:'none'}),clear(){
      effect?.clear();grid.classList.remove('pixi-focus');tokens.forEach(token=>token.removeAttribute('style'));
    }};
  }
  async function illuminateWins(nodes,desktop){
    const grid=$('grid'),highlight=highlightSymbols(nodes,{desktop});grid.classList.add('win-focus');
    try{
      await Promise.all([
        animate(highlight.tokens,{scale:1,yPercent:0,rotation:0},{
          scale:i=>nodes[i].dataset.symbol==='P3'?1.11:1.065,
          yPercent:i=>({P1:-4,P2:-7,P4:-4}[nodes[i].dataset.symbol]||0),
          rotation:i=>({C1:-3,C2:2,C3:-2,C4:2,P1:-2}[nodes[i].dataset.symbol]||0),
          duration:.29,repeat:1,yoyo:true,ease:'sine.inOut',clearProps:'transform'}),
        highlight.play()
      ]);
      await wait(options().reduced?280:160);
    }finally{highlight.clear();grid.classList.remove('win-focus');}
  }
  function award(value,label,kind='win'){
    const root=$('tumbleAward'),caption=document.createElement('span'),amount=document.createElement('strong');
    caption.textContent=label;amount.textContent=value;root.dataset.kind=kind;root.replaceChildren(caption,amount);root.hidden=false;
    return animate([root],{opacity:0,y:10},{opacity:1,y:0,duration:.24,ease:'power2.out',clearProps:'transform,opacity'});
  }
  function clusterAwards(event,book){
    const labels=event.clusters.map(cluster=>{
      const label=document.createElement('span');label.className='cluster-award';
      const value=document.createElement('span');value.className='cluster-award-value';
      value.textContent=format(cluster.payoutHundredths*book.bet/100);label.append(value);
      label.setAttribute('aria-label',`${SYMBOL_NAMES[cluster.symbol]} cluster: ${label.textContent} play credits`);
      return label;
    });
    awards.replaceChildren(...labels);
    const {width,height}=$('grid').getBoundingClientRect();
    const sizes=labels.map(label=>({width:width?label.offsetWidth/width*6:1.4,height:height?label.offsetHeight/height*5:.55}));
    clusterAwardPositions(event.clusters,sizes).forEach((p,i)=>{labels[i].style.left=`${p.x}%`;labels[i].style.top=`${p.y}%`;});
    // Keep the positioned parent untouched; only animate its inner text.
    return labels.map(label=>label.firstElementChild);
  }
  function meter(id,total,value,label){
    if($(id).children.length!==total)$(id).replaceChildren(...Array.from({length:total},()=>{
      const el=document.createElement('i');el.className=id==='blood'?'blood-gem':'offering-gem';
      const asset=id==='blood'?'blood':'offering';
      const base=relicIcon(`${asset}-empty`);base.className='meter-base';
      const fill=document.createElement('span');fill.className='meter-fill';const filled=relicIcon(`${asset}-filled`);fill.append(filled);
      const gleam=document.createElement('span');gleam.className='meter-gleam';el.append(base,fill,gleam);
      if(id==='offerings'){
        const glass=document.createElement('span');glass.className='offering-glass';glass.setAttribute('aria-hidden','true');el.append(glass);
      }
      applyArt(base,`${asset}-empty`,{container:el});applyArt(filled,`${asset}-filled`,{container:fill});return el;
    }));
    [...$(id).children].forEach((el,i)=>el.classList.toggle('filled',i<value));
    $(id).setAttribute('aria-label',`${label}: ${value} of ${total}`);
    $(id==='blood'?'bloodNumber':'offeringNumber').textContent=`${value} / ${total}`;
  }
  function readouts(model,{animateAltar=false}={}){
    if(model.state){
      $('multiplier').textContent=`×${model.state.tier}`;
      const ladder=$('altarLadder'),tiers=config.tiers||manifest.altar?.tiers||ALTAR_TIERS;
      if(ladder){
        if(ladder.children.length!==tiers.length)ladder.replaceChildren(...tiers.map(tier=>{const step=document.createElement('li');step.dataset.tier=tier;step.textContent=`×${tier}`;return step;}));
        let current=0;
        [...ladder.children].forEach((step,index)=>{
          const tier=tiers[index],earned=tier===model.state.tier;step.className=tier<model.state.tier?'passed':earned?'earned':'upcoming';
          if(earned)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');
          step.toggleAttribute('data-pending',!earned&&tier===model.pending);
          if(tier<=model.state.tier)current=index;
        });
        const fraction=model.state.sealed?0:Math.min(1,model.state.blood/model.rules.bloodThreshold);
        document.querySelector('.altar-header').style.setProperty('--altar-progress',`${Math.min(100,(current+fraction)/(tiers.length-1)*100)}%`);
        ladder.setAttribute('aria-label',`Earned altar multiplier ×${model.state.tier}${model.state.sealed?', maximum tier':`, ${model.state.blood} of ${model.rules.bloodThreshold} Blood toward the next step`}${model.pending?`, ×${model.pending} pending`:''}`);
        meters.positionAltar(current,tiers.length,fraction,animateAltar);
      }
      meter('blood',model.rules.bloodThreshold,model.state.sealed?0:model.state.blood,'Blood');
      meter('offerings',model.rules.offeringThreshold,model.state.sealed?0:model.state.offerings,'Offerings');
      if(!model.feature)$('offerings').setAttribute('aria-label','Offering vessels, available during bonus rites');
      if(model.state.sealed)$('bloodNumber').textContent=$('offeringNumber').textContent='SEALED';
      const offeringPanel=document.querySelector('.offering-panel');
      offeringPanel.classList.toggle('is-dormant',!model.feature||model.state.sealed);
      offeringPanel.classList.toggle('has-pending',!!model.pending);
      $('offeringReadout').toggleAttribute('inert',!model.feature);
      $('offeringHint').textContent=model.state.sealed?'The altar is complete':model.pending?(model.state.pendingStage==='nextSpin'?'Last chance · Win on the next spin':'Win the next tumble to confirm'):`${model.rules.offeringThreshold} Offerings invoke the patron`;
      document.querySelector('.altar-header').classList.toggle('is-sealed',!!model.state.sealed);
    }
    const counter = bonusCounterText(model.counter);
    const panel = document.querySelector('.spin-counter');
    panel.hidden = !counter;
    if (counter) {
      panel.querySelector('span').textContent = counter.label;
      $('remaining').textContent = counter.value;
      panel.dataset.words = String(counter.value.length > 2);
      panel.dataset.phase = model.counter.phase;
      panel.setAttribute('aria-label', counter.announcement);
    }
    $('roundWin').textContent=format(model.payout);
    $('pending').hidden=!model.pending;
    if(model.pending)$('pending').querySelector('strong').textContent=`×${model.pending}`;
  }
  async function collectRelics(event,nodes,model,desktop){
    if(noMotion())return;
    if($('blood').children.length!==model.rules.bloodThreshold)meter('blood',model.rules.bloodThreshold,event.before.blood,'Blood');
    if($('offerings').children.length!==model.rules.offeringThreshold)meter('offerings',model.rules.offeringThreshold,event.before.offerings,'Offerings');
    const scene=document.querySelector('.scene'),bounds=scene.getBoundingClientRect();
    const sources=[];
    for(const [i,cluster] of event.clusters.slice(0,event.bloodCollected||0).entries()){
      const boxes=cluster.positions.map(p=>nodes[p].getBoundingClientRect());
      sources.push({kind:'blood',index:(event.before.blood+i)%model.rules.bloodThreshold,
        x:boxes.reduce((sum,b)=>sum+b.left+b.width/2,0)/boxes.length,y:boxes.reduce((sum,b)=>sum+b.top+b.height/2,0)/boxes.length});
    }
    const marked=event.clusters.flatMap(c=>c.markedPositions??c.positions.filter(p=>nodes[p].querySelector('.mark'))).slice(0,event.offeringsCollected||0);
    marked.forEach((p,i)=>{const box=(nodes[p].querySelector('.mark')||nodes[p]).getBoundingClientRect();sources.push({kind:'offerings',index:(event.before.offerings+i)%model.rules.offeringThreshold,x:box.left+box.width/2,y:box.top+box.height/2});});
    const motes=[],flows=[],touched=new Set(),desktopMeters=meters.enabled();
    const launchDelay=desktop ? SYMBOL_POP_TIME : 0;
    let effect,canvasSized=false;
    try{
      for(const [i,source] of sources.entries()){
        const target=$(source.kind).children[source.index],glass=desktopMeters&&source.kind==='offerings';
        const box=(glass?target.querySelector('.offering-glass'):target).getBoundingClientRect();
        const from={x:source.x-bounds.left,y:source.y-bounds.top};
        const to={x:box.left+box.width/2-bounds.left,y:box.top+box.height*(glass ? .5 : .57)-bounds.top};
        const direction=from.x<bounds.width/2 ? -1 : 1;
        const sway=desktop&&source.kind==='blood' ? direction*Math.min(102,bounds.width*.071) : 0;
        flows.push({kind:source.kind,target,glass,fill:target.querySelector('.meter-fill'),wasFilled:target.classList.contains('filled'),
          delay:launchDelay+Math.min(i*.045,.24),from,to,bend:Math.min(100,bounds.height*.16),sway});
        touched.add(target);
      }
      if(!flows.length)return;
      const fragment=document.createDocumentFragment();
      for(const flow of flows){
        const mote=document.createElement('span');mote.className=`collection-mote ${flow.kind==='blood'?'blood-mote':'offering-mote'}`;
        mote.classList.toggle('desktop-collection-mote',desktop);
        if(flow.kind==='offerings'){const icon=relicIcon();mote.append(icon);applyArt(icon,'offering-mark',{container:mote});}
        flow.mote=mote;motes.push(mote);fragment.append(mote);
      }
      collectionLayer.append(fragment);
      const clock={time:0},duration=.84+Math.max(...flows.map(f=>f.delay));
      const landing=desktop?COLLECTION_LANDING_TIME:.7*COLLECTION_FLIGHT_TIME;
      if(desktop)effect=life.cascadeEffect('collection',{flows,clock});
      const render=()=>{
        if(noMotion())return;
        if(!effect?.active){
          if(!canvasSized){bloodstream.resize(bounds);canvasSized=true;}
          bloodstream.draw(flows,clock.time);
        }
        for(const [index,flow] of flows.entries()){
          const age=clock.time-flow.delay,p=Math.max(0,Math.min(1,age/COLLECTION_FLIGHT_TIME));
          const head=collectionHead(age),point=streamPoint(flow.from,flow.to,head,flow.bend,flow.sway);
          if(desktop){
            const swallow=Math.max(0,Math.min(1,(age-landing)/.15));
            const previous=streamPoint(flow.from,flow.to,Math.max(0,head-.025),flow.bend,flow.sway);
            const rotation=flow.kind==='offerings'?-17+39*head:Math.atan2(point.y-previous.y,point.x-previous.x)*180/Math.PI-90;
            const scale=(.78+Math.sin(head*Math.PI)*.35)*(1-swallow*.67);
            flow.mote.style.transform=`translate(${point.x}px,${point.y}px) rotate(${rotation}deg) scale(${scale})`;
            flow.mote.style.opacity=String(Math.max(0,Math.min(1,age/.068))*(1-swallow));
          }else{
            flow.mote.style.transform=`translate(${point.x}px,${point.y}px) scale(${.7+Math.sin(p*Math.PI)*.35})`;
            flow.mote.style.opacity=String(age<0?0:Math.min(1,p*8)*(1-Math.max(0,(p-.72)/.28)));
          }
          if(age>=landing){
            if(!flow.received){
              flow.received=true;
              flow.target.classList.add('is-receiving');
              if(flow.glass)meters.lightVessel(flow.target);
              if(flow.kind==='offerings')mascot.react('offering',{key:`offering:${event.spin}:${event.cascade}:${index}`,priority:.4});
            }
            if(!flow.wasFilled){
              const fillTime=flow.glass ? (desktop ? .26 : .30) : COLLECTION_FLIGHT_TIME*.25;
              const rise=Math.min(1,(age-landing)/fillTime);
              const level=(1-rise)**1.55;
              const rim=flow.glass&&rise<1?32+38*level:100*(1-rise);
              if(flow.glass){
                flow.target.style.setProperty('--vessel-surface',level);
                flow.target.style.setProperty('--vessel-surface-light',Math.sin(rise*Math.PI));
              }
              flow.fill.style.clipPath=`inset(${rim}% 0 0)`;
            }
          }
        }
      };
      render();
      await new Promise(resolve=>{
        let tween;const done=()=>{active.delete(tween);resolve();};
        tween=gsap.to(clock,{time:duration,duration,ease:'none',onUpdate:render,onComplete:done,onInterrupt:done});
        active.add(tween.timeScale(speed()));
      });
    }finally{
      effect?.clear();
      motes.forEach(el=>el.remove());bloodstream.clear();
      for(const target of touched){
        target.classList.remove('is-receiving');target.querySelector('.meter-fill').removeAttribute('style');
        target.style.removeProperty('--vessel-surface');target.style.removeProperty('--vessel-surface-light');
      }
    }
  }
  async function celebrateProgress(event,{resolution=false}={}){
    const panels=[],desktopMeters=meters.enabled();
    if(event.bloodCollected)panels.push($('blood'));
    if(event.offeringsCollected)panels.push($('offerings'));
    const altar=document.querySelector('.altar-header'),offering=document.querySelector('.offering-panel');
    const bloodAdvanced=event.after.tier>event.before.tier&&!resolution;
    const promoted=bloodAdvanced&&!event.promotedTier;
    if(!noMotion()){
      if(promoted)life.pulse('altar');
      if(bloodAdvanced)life.celebrate('blood');
    }
    if(promoted&&!event.promotedTier&&!resolution&&!quick())mascot.react('altar',{key:`altar:${event.spin}:${event.cascade}`,priority:1});
    if(promoted&&!desktopMeters)altar.classList.add('altar-ascending');
    if(event.promotedTier&&!desktopMeters)offering.classList.add('is-invoking');
    try{
      await Promise.all([
        animate(desktopMeters?[]:panels,{scale:1},{scale:1.08,duration:.16,repeat:1,yoyo:true,ease:'sine.inOut',clearProps:'transform'}),
        promoted?animate([$('multiplier')],{scale:.86,opacity:.6},{scale:1,opacity:1,duration:.5,ease:'back.out(1.6)',clearProps:'transform,opacity'}):Promise.resolve()
      ]);
    }finally{altar.classList.remove('altar-ascending');offering.classList.remove('is-invoking');}
  }
  function prepareDialogArt(id){
    const url=artUrl(id),image=$('featureArt');
    if(url&&image.getAttribute('src')!==url)image.src=url;
  }
  function layoutDialogArt(id,kind){
    const dialog=$('featureDialog'),relic=dialog.querySelector('.feature-relic'),reveal=dialog.querySelector('.feature-reveal'),amount=dialog.querySelector('.feature-award');
    const occupancy=kind==='celebration'?.98:.95;
    const releaseArt=applyArt($('featureArt'),id,{occupancy,container:relic});
    const ledgerMotion=$('ledgerMotion'),isLedger=kind==='result';
    ledgerMotion.hidden=!isLedger;
    if(isLedger)ledgerMotion.style.setProperty('--ledger-image',`url("${artUrl(id)}")`);
    for(const property of ['--amount-x','--amount-y','--amount-width','--amount-height','--amount-font-size'])reveal.style.removeProperty(property);
    delete amount.dataset.registered;
    if(kind!=='celebration'&&!isLedger)return releaseArt;
    let disposed=false;
    const refresh=()=>{
      if(disposed)return;
      if(isLedger){
        const box=artBox(id,relic.clientWidth,relic.clientHeight,occupancy);
        if(box){
          for(const property of ['left','top','width','height'])ledgerMotion.style[property]=box[property]+'px';
        }
        return;
      }
      const box=celebrationAmountBox(id,relic.clientWidth,relic.clientHeight);if(!box)return;
      // Offset coordinates do not include the entrance animation's transforms.
      const left=relic.offsetLeft+box.left,top=relic.offsetTop+box.top;
      for(const [name,value] of Object.entries({x:left,y:top,width:box.width,height:box.height}))reveal.style.setProperty(`--amount-${name}`,`${value}px`);
      const finalValue=$('featureValue').dataset.finalValue||$('featureValue').textContent;
      const digits=finalValue.replace(/\D/g,'').length;
      const textWidth=Math.max(3,digits*.60+(finalValue.length-digits)*.28);
      const fontSize=Math.min(box.height*.58,box.width*.95/textWidth);
      reveal.style.setProperty('--amount-font-size',`${fontSize}px`);
      amount.dataset.registered='true';
    };
    const window=document.defaultView,observer=window.ResizeObserver?new window.ResizeObserver(refresh):null;
    observer?.observe(relic);window.addEventListener('resize',refresh,{passive:true});
    const frame=(window.requestAnimationFrame||window.setTimeout.bind(window))(refresh);
    document.fonts?.ready.then(refresh);refresh();
    return ()=>{disposed=true;releaseArt();observer?.disconnect();window.removeEventListener('resize',refresh);(window.cancelAnimationFrame||window.clearTimeout.bind(window))(frame);};
  }
  async function overlay({title,value,unit,detail,button='Continue',eyebrow='THE NINTH RITE',mode=featureMode,kind='result',tier=null,winTier=null,amount=null,resultWon=false}){
    if(quick())return;
    $('featureEyebrow').textContent=eyebrow;$('featureTitle').textContent=title;
    $('featureValue').textContent=value;$('featureUnit').textContent=unit;$('featureDetail').textContent=detail;
    $('featureDetail').hidden=!detail;
    $('featureValue').dataset.finalValue=value;
    $('featureContinue').textContent=button;
    const dialog=$('featureDialog');dialog.dataset.rite=mode||'lesser';dialog.dataset.kind=kind;
    dialog.toggleAttribute('data-result-win',kind==='result'&&resultWon);
    if(detail)dialog.setAttribute('aria-describedby','featureDetail');
    else dialog.removeAttribute('aria-describedby');
    const bonusArt=kind==='retrigger'?'bonus-retrigger':`bonus-entry-${mode}`;
    const hasBonusReveal=mode!=='god'&&(kind==='entry'||kind==='retrigger')&&Boolean(getArt(bonusArt));
    dialog.toggleAttribute('data-bonus-reveal',hasBonusReveal);
    const art=hasBonusReveal?bonusArt:kind==='celebration'?`win-${winTier}`:kind==='cap'?'win-max':kind==='result'?'result-ledger':kind==='retrigger'?'symbol-scatter':`rite-${mode}`;
    dialog.dataset.art=art;dialog.dataset.winTier=winTier||'';
    const backdrop=['result','celebration','cap'].includes(kind)?'feature-result':mode==='god'?'environment-god':'environment-bonus';
    dialog.style.setProperty('--feature-backdrop',`url("${artUrl(backdrop)}")`);
    $('featureAwardCaption').textContent=kind==='entry'?'AWARDED':kind==='retrigger'?'ADDITIONAL SPINS':'TOTAL RETURN';
    $('featureAltar').hidden=tier===null;$('featureAltarValue').textContent=tier===null?'':`×${tier}`;
    $('featureAltarLabel').textContent=kind==='retrigger'?'CURRENT ALTAR':'STARTING ALTAR';
    $('featureSkip').hidden=!['entry','retrigger'].includes(kind);dialogClosing=false;
    const dismissed=new Promise(resolve=>{dialogDone=resolve;});
    dialog.showModal();dialog.scrollTop=0;
    dialogLayoutCleanup?.();dialogLayoutCleanup=layoutDialogArt(art,kind);
    dialogMotion?.finish();dialogMotion=life.ceremony(dialog,{kind,tier:winTier,amount,format,finalText:value});
    if(!hasBonusReveal&&!winTier&&kind!=='result')await Promise.all([
      animate([$('featureContent')],{opacity:0},{opacity:1,duration:.35,clearProps:'opacity'}),
      animate([dialog.querySelector('.feature-heading')],{opacity:0,y:-12},{opacity:1,y:0,duration:.45,ease:'power2.out',clearProps:'all'}),
      animate([dialog.querySelector('.feature-relic')],{opacity:0,y:25,scale:.9},{opacity:1,y:0,scale:1,duration:.7,ease:'power3.out',clearProps:'transform,opacity'}),
      animate([dialog.querySelector('.feature-award')],{opacity:0,y:18},{opacity:1,y:0,duration:.45,delay:.16,ease:'power2.out',clearProps:'all'}),
      animate([dialog.querySelector('.feature-actions')],{opacity:0,y:10},{opacity:1,y:0,duration:.35,delay:.28,ease:'power2.out',clearProps:'all'})
    ]);
    await dismissed;
  }
  async function signalScatters(label='BONUS UNLOCKED',value='THE RITE AWAKENS',key='feature-entry'){
    if(quick())return;
    if(!noMotion())life.pulse('scatter');
    if(label==='RETRIGGER'||!bonusAwakened){
      mascot.react('bonus',{key,priority:2});
      if (!noMotion()) life.celebrate('scatter');
      bonusAwakened=true;
    }
    const nodes=[...$('grid').children].filter(el=>el.dataset.symbol==='S');
    if(!nodes.length)return;
    const grid=$('grid'),reels=grid.closest('.reels'),highlight=highlightSymbols(nodes,{desktop:life.desktopMotion(),ritual:true});
    nodes.forEach(el=>el.classList.add('scatter-active'));grid.classList.add('scatter-focus');reels.classList.add('ritual-active');
    try{
      await Promise.all([
        animate(highlight.tokens,{scale:1,yPercent:0},{scale:1.09,yPercent:-3,duration:.45,stagger:.09,ease:'power2.out'}),
        highlight.play()
      ]);
      if(quick())return;
      await award(value,label,'scatter');await wait(options().reduced?300:450);
      await animate(highlight.tokens,{scale:1.09,yPercent:-3},{scale:1,yPercent:0,duration:.2,ease:'power2.out',clearProps:'transform'});
    }finally{
      highlight.clear();nodes.forEach(el=>el.classList.remove('scatter-active'));
      grid.classList.remove('scatter-focus');reels.classList.remove('ritual-active');$('tumbleAward').hidden=true;
    }
  }
  return {
    skip,board,message,readouts,
    setSpeed(value){for(const animation of active)animation.timeScale(value);meters.setSpeed(value);},
    flashSpin:life.flashSpin,
    begin(_book,model,settings){skipped=false;instant=settings.instant;replaying=settings.replay;featureMode=null;bonusAwakened=false;capReached=false;meters.reset();environment('base');intervention.reset();mascot.beginRound?.();mascot.setSpeed?.(speed());if(instant)mascot.cancel?.();
      awards.replaceChildren();
      readouts(model);$('pending').hidden=true;$('tumbleAward').hidden=true;},
    async purchase(entry,book){if(!quick())prepareDialogArt(`bonus-entry-${book.mode}`);message('Purchased rite · scatters arriving');await board(entry);await signalScatters('PURCHASED RITE',config.modes[book.mode].name);},
    async event(event,model,book,context={}){
      if(!['cascade','interventionConfirmed','interventionExpired','godIntervention'].includes(event.type))readouts(model);
      switch(event.type){
        case 'roundStart':message(replaying?'Replaying recorded round · balance unchanged':'The rite begins');break;
        case 'spinStart':
          message(event.feature?`Free spin · ${event.remaining} remain after this spin`:'Spinning');
          if(!quick()){if(event.feature)sound?.('spin');mascot.react('spin',{key:`spin:${event.spin}`,priority:.2});}
          await wait(200);break;
        case 'board':await board(event.board,model.moves);await wait(150);break;
        case 'featureStart':
          featureMode=event.mode;environment(event.mode);
          if(!quick()){prepareDialogArt(`bonus-entry-${event.mode}`);sound?.('bonus');}
          if(!quick()&&!bonusAwakened){
            mascot.react('bonus',{key:'feature-entry',priority:2});
            bonusAwakened=true;
            if (!noMotion()) life.celebrate('scatter');
          }
          if (mascot.clipTime?.('bonus') != null) await waitForPriestPose('bonus', .95);
          await overlay({title:config.modes[event.mode].name,value:String(event.spins),unit:event.mode==='god'?'RITUAL SPIN':'FREE SPINS',mode:event.mode,kind:'entry',tier:event.state.tier,
            detail:event.mode==='god'?'A guaranteed pre-spin multiplier. A win is not guaranteed.':`${model.rules.offeringThreshold} Offerings invoke a pending multiplier. Win the next tumble${model.rules.interventionTiming==='next-tumble-or-next-spin'?' or the following free spin':''} to confirm it.`,
            button:'Enter the rite',eyebrow:event.natural?'BONUS UNLOCKED':artUrl(`bonus-entry-${event.mode}`)?'':'THE RITE IS READY'});break;
        case 'godIntervention':message(`Guaranteed pre-spin altar ×${event.tier}`);await intervention.invoke(event,model,{guaranteed:true});break;
        case 'cascade':{
          const nodes=[...$('grid').children],wins=event.clusters.flatMap(c=>c.positions);
          wins.forEach(p=>nodes[p].classList.add('winning'));
          event.orphanPositions.forEach(p=>nodes[p].classList.add('orphan'));
          message(`${event.clusters.length} winning clusters · paid at ×${event.payoutMultiplier}`);
          const labels=clusterAwards(event,book);$('tumbleAward').hidden=true;
          const desktop=!noMotion()&&life.desktopMotion();
          try{
            await Promise.all([
              animate(labels,{opacity:0,scale:.78,y:8},{opacity:1,scale:1,y:0,duration:.24,ease:'back.out(1.35)'}),
              illuminateWins(wins.map(p=>nodes[p]),desktop)
            ]);
            const pop=()=>Promise.all([clearSymbols(nodes,event,desktop),animate(labels,{opacity:1,y:0},{opacity:0,y:-10,duration:.23,ease:'power1.in'})]);
            await Promise.all([collectRelics(event,nodes,model,desktop),desktop?pop():null]);
            readouts(model,{animateAltar:true});if(!quick())mascot.highlight?.({key:`win:${event.spin}:${event.cascade}`,intensity:Math.min(1.2,1+(event.cascade||0)*.03)});
            await Promise.all([desktop?null:pop(),celebrateProgress(event,{resolution:context.previous?.type==='interventionConfirmed'})]);
          }finally{awards.replaceChildren();}
          break;
        }
        case 'interventionPending':
          message(`×${event.tier} pending · win the next tumble`);
          if (!noMotion()) life.celebrate('offering');
          await intervention.invoke(event,model);
          break;
        case 'interventionDeferred':message(`×${event.tier} pending · last chance on the next spin`);intervention.defer(event);break;
        case 'interventionConfirmed':message(`×${event.tier} confirmed`);await intervention.confirm(event,model);break;
        case 'interventionExpired':message(`×${event.tier} expired · altar remains ×${event.state.tier}`);await intervention.expire(event,model);break;
        case 'retrigger':
          if(!quick()&&featureMode!=='god')prepareDialogArt('bonus-retrigger');
          await signalScatters('RETRIGGER',`+${event.added} FREE SPINS`,`retrigger:${model.spin}:${context.index??event.remaining}`);
          await waitForPriestPose('bonus', .95);
          await overlay({
            title:'The rite continues',
            value:`+${event.added}`,
            unit:'FREE SPINS',
            kind:'retrigger',
            tier:model.state?.tier??null,
            detail:`${event.remaining} spins remain. The altar and Offerings carry on.`,
            eyebrow:featureMode==='god'?'THE NINTH RITE':'',
          });
          break;
        case 'naturalBonus':if(!quick())prepareDialogArt(`bonus-entry-${event.mode}`);message(`${config.modes[event.mode].name} unlocked`);await signalScatters('BONUS UNLOCKED',config.modes[event.mode].name);break;
        case 'spinEnd':await wait(250);break;
        case 'winCap':capReached=true;message('Maximum round return reached');break;
        case 'roundEnd':{
          message(`${replaying?'Replay':'Round'} complete · ${format(book.payout)} play credits returned`);
          if(!quick()&&book.payout>0)sound?.('win');
          const celebration=roundCelebration(book,{featureMode,featureName:config.modes[featureMode]?.name,modeCost:config.modes[book.mode].cost,replay:replaying});
          const atCap=capReached||book.capReached===true;
          const winTier=atCap?'cap':celebration?.winTier;
          const kind=atCap?'cap':winTier?'celebration':'result';
          if(!quick()&&winTier){
            prepareDialogArt(atCap?'win-max':`win-${winTier}`);
            mascot.react('celebration',{key:'celebration:'+book.id,priority:2});
            if (!noMotion()) {
              life.celebrate('win');
              await waitForPriestPose('celebration', .82);
            }
          }
          if(celebration||atCap)await overlay({
            title:atCap?'Max Win':celebration.title,
            value:format(book.payout),
            amount:book.payout,
            unit:'PLAY CREDITS',
            detail:atCap?'Maximum round return reached.':celebration.detail,
            eyebrow:atCap||(kind==='result'&&book.payout===0)?'':celebration.eyebrow,
            kind,
            winTier,
            resultWon:celebration?.kind==='win',
          });
          break;
        }
      }
    },
    end(book,model){finishDialog();intervention.reset();if(quick())mascot.cancel?.();readouts(model);environment('base');awards.replaceChildren();$('tumbleAward').hidden=true;},
    destroy(){skip();meters.destroy();life.destroy();intervention.destroy();collectionLayer.remove();awards.remove();$('featureContinue').removeEventListener('click',dismissDialog);$('featureSkip').removeEventListener('click',skip);$('featureDialog').removeEventListener('cancel',cancelDialog);document.removeEventListener('visibilitychange',visibility);}
  };
}
