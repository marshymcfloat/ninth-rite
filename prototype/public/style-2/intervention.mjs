import {createCollectionCanvas,streamPoint} from './collection-fx.mjs';
import {artUrl} from './art.mjs';

export function createIntervention({document,mascot,animate,quick,noMotion,readouts,manifest={},meters,life}){
  const $=id=>document.getElementById(id),scene=document.querySelector('.scene'),patron=document.querySelector('.patron');
  const timings={invoke:1.2,confirm:.8,expire:.6,...manifest.intervention?.timings};
  const root=document.createElement('div');root.className='revelation';root.hidden=true;root.setAttribute('aria-hidden','true');
  const rays=document.createElement('img');rays.className='revelation-rays';rays.src=manifest.intervention?.rays||artUrl('ray-texture');rays.alt='';
  const halo=document.createElement('img');halo.className='revelation-halo';halo.src=manifest.intervention?.halo||artUrl('rose-halo');halo.alt='';
  const motes=document.createElement('div');motes.className='revelation-motes';
  for(let i=0;i<9;i++){const mote=document.createElement('i');mote.style.setProperty('--i',i);motes.append(mote);}
  root.append(rays,halo,motes);patron.prepend(root);
  const layer=document.createElement('div');layer.className='ceremony-layer';layer.setAttribute('aria-hidden','true');scene.append(layer);
  const canvas=createCollectionCanvas(document,layer),pending=$('pending');
  let epoch=0,state='idle',offered=null;
  function stage(value){state=value;root.dataset.phase=value;patron.dataset.ceremony=value;scene.dataset.ceremony=value;root.hidden=value==='idle';}
  function clearTransient(){canvas.clear();layer.replaceChildren(layer.querySelector('canvas'));for(const node of $('offerings').children)node.classList.remove('is-invoking');}
  function reset(){epoch++;clearTransient();stage('idle');offered=null;mascot.setPending?.(false);pending.hidden=true;pending.removeAttribute('style');root.removeAttribute('style');rays.removeAttribute('style');halo.removeAttribute('style');}
  const point=(el,x=.5,y=.5)=>{const box=el.getBoundingClientRect(),bounds=scene.getBoundingClientRect();return {x:box.left+box.width*x-bounds.left,y:box.top+box.height*y-bounds.top};};
  async function flight(flows,duration,{arrive,target}={}){
    if(noMotion()){arrive?.();return;}
    const id=epoch,clock={time:0};let arrived=false,canvasSized=false;
    const effect=life?.cascadeEffect('collection',{flows,clock});
    const bead=document.createElement('i');bead.className='ceremony-bead';if(!effect&&!canvas.available)layer.append(bead);
    try{await animate([clock],{time:0},{time:.84,duration,ease:'none',onUpdate(){
      if(id!==epoch||noMotion())return;
      const progress=clock.time/.84;
      if(target){const to=target();for(const flow of flows)flow.to=to;}
      if(!effect?.active){
        if(!canvasSized){canvas.resize(scene.getBoundingClientRect());canvasSized=true;}
        canvas.draw(flows,clock.time);
        if(bead.isConnected){
          const f=flows[flows.length-1],p=streamPoint(f.from,f.to,Math.min(1,progress*1.22),f.bend);
          bead.style.transform=`translate(${p.x}px,${p.y}px)`;bead.style.opacity=String(Math.sin(progress*Math.PI));
        }
      }
      if(!arrived&&progress>=.82){arrived=true;arrive?.();}
    }});}finally{effect?.clear();bead.remove();canvas.clear();if(id===epoch&&!arrived)arrive?.();}
  }
  async function invoke(event,model,{guaranteed=false}={}){
    const id=++epoch;offered=event.tier;stage(guaranteed?'god':'invoking');
    pending.hidden=false;pending.querySelector('span').textContent=guaranteed?'GUARANTEED':'PENDING';
    pending.querySelector('strong').textContent=`×${event.tier}`;pending.querySelector('b').textContent=guaranteed?'THE ALTAR AWAKENS':'Win the next tumble';
    if(!quick())mascot.react('invocation',{key:`invoke:${event.spin}:${event.cascade}`,priority:3});
    mascot.setPending?.(!guaranteed);
    const vessels=[...$('offerings').children];vessels.forEach(el=>el.classList.add('is-invoking'));
    const animateVessels = !guaranteed && meters?.enabled();
    if(animateVessels)meters.releaseVessels(vessels);
    const target=()=>mascot.getAnchor?.('vessel',scene)||point($('mascot'),.4,.37),to=target(),flows=vessels.map((el,i)=>({from:point(el),to,kind:'blood',delay:i*.06,bend:35}));
    try{await Promise.all([
      animate(animateVessels?[]:vessels,{filter:'brightness(1)'},{filter:'brightness(2)',duration:.18,stagger:.12,repeat:1,yoyo:true,clearProps:'filter'}),
      animate([halo],{opacity:0,scale:.82,rotation:-9},{opacity:1,scale:1,rotation:0,duration:timings.invoke,ease:'power2.out',clearProps:'all'}),
      animate([rays],{opacity:0,scaleY:.25},{opacity:.6,scaleY:1,duration:timings.invoke*.7,ease:'power2.out',clearProps:'all'}),
      animate([pending],{opacity:0,y:8},{opacity:1,y:0,duration:.3,delay:timings.invoke-.3,clearProps:'opacity,transform'}),
      flight(flows,timings.invoke,{target})
    ]);}finally{vessels.forEach(el=>{el.classList.remove('is-invoking');el.style.removeProperty('filter');});}
    if(id!==epoch)return;
    if(guaranteed){await confirm(event,model,{gesture:false});return;}
    stage('waiting');
  }
  async function confirm(event,model,{gesture=true}={}){
    const id=++epoch;stage('confirming');
    pending.hidden=false;pending.querySelector('span').textContent='CONFIRMED';pending.querySelector('b').textContent='THE ALTAR RISES';pending.querySelector('strong').textContent=`×${event.tier}`;
    mascot.setPending?.(false);
    if(gesture&&!quick())mascot.react('benediction',{priority:4,key:`confirm:${event.spin}:${event.cascade}`});
    else if(!quick())mascot.settle?.();
    const from=point(pending),to=point($('multiplier'));
    // Route the transfer through the header, above the readable reel area.
    const flow={from,to,kind:'offerings',delay:0,bend:Math.max(60,from.y-to.y)};
    await Promise.all([
      flight([flow],timings.confirm,{arrive:()=>{if(id===epoch)readouts(model,{animateAltar:true});}}),
      animate([rays],{opacity:.13},{opacity:0,duration:timings.confirm,clearProps:'opacity'}),
      animate([halo,pending],{opacity:1},{opacity:0,duration:.22,delay:timings.confirm-.22,ease:'power1.in',clearProps:'opacity'})
    ]);
    if(id!==epoch)return;
    readouts(model);reset();
  }
  function defer(event){
    mascot.setPending?.(true);
    offered=event.tier;stage('waiting');pending.hidden=false;
    pending.querySelector('span').textContent='LAST CHANCE';
    pending.querySelector('strong').textContent=`×${event.tier}`;
    pending.querySelector('b').textContent='Win on the next spin';
  }
  async function expire(event,model){
    const id=++epoch;stage('expiring');
    mascot.setPending?.(false);
    if(!quick())mascot.react('expiry',{priority:4,key:`expire:${event.spin}:${event.cascade}`});
    const origin=point(pending),dust=Array.from({length:12},(_,i)=>{const el=document.createElement('i');el.className='revelation-dust';el.style.left=`${origin.x+(i%4-1.5)*10}px`;el.style.top=`${origin.y+(Math.floor(i/4)-1)*12}px`;layer.append(el);return el;});
    try{await Promise.all([
      animate([pending],{opacity:1,y:0},{opacity:0,y:8,duration:timings.expire,ease:'power2.in',clearProps:'opacity,transform'}),
      animate([rays,halo],{opacity:1,scale:1},{opacity:0,scale:.72,duration:timings.expire,ease:'power2.in',clearProps:'all'}),
      animate(dust,{opacity:.9,x:0,y:0},{opacity:0,x:i=>(i%2?1:-1)*(12+i*3),y:30,duration:timings.expire,ease:'power1.out'})
    ]);}finally{dust.forEach(el=>el.remove());}
    if(id!==epoch)return;readouts(model);reset();
  }
  return {invoke,defer,confirm,expire,reset,destroy(){reset();root.remove();layer.remove();},get state(){return state;},get offered(){return offered;}};
}
