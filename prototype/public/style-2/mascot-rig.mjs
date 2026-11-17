import {PriestMotion,armPoint,rotatePoint} from './mascot-motion.mjs';
import {loadPixi} from './collection-fx.mjs';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
function abortable(promise,signal){return new Promise((resolve,reject)=>{const stop=()=>reject(Error('Optional rig loading cancelled'));if(signal?.aborted){stop();return;}signal?.addEventListener('abort',stop,{once:true});promise.then(resolve,reject).finally(()=>signal?.removeEventListener('abort',stop));});}
export async function createPriestRig(root,{url,gsap,signal}={}){
  if(!gsap||!root.ownerDocument.defaultView.WebGL2RenderingContext)throw Error('Static character fallback');
  const doc=root.ownerDocument,win=doc.defaultView,P=await loadPixi(doc);
  P.Assets.setPreferences({preferWorkers:false,preferCreateImageBitmap:false});
  const response=await fetch(url,{signal});if(!response.ok)throw Error('Rig manifest unavailable');const data=await response.json();
  const textures={};await abortable(Promise.all(Object.entries(data.assets).map(async([id,a])=>{textures[id]=await P.Assets.load(a.url);})),signal);
  if(signal?.aborted)throw Error('Rig cancelled');
  const app=new P.Application();
  await app.init({preference:'webgl',backgroundAlpha:0,antialias:true,autoStart:false,sharedTicker:false,resolution:Math.min(win.devicePixelRatio||1,2),width:Math.max(1,root.clientWidth),height:Math.max(1,root.clientHeight)});
  if(signal?.aborted){app.destroy(true,{children:true});throw Error('Rig cancelled');}
  app.canvas.className='mascot-rig';app.canvas.setAttribute('aria-hidden','true');root.append(app.canvas);
  const stage=new P.Container();stage.sortableChildren=true;app.stage.addChild(stage);
  const depth=new Map(data.drawOrder.map((id,index)=>[id,index]));
  const order=(display,id)=>{display.label=id;display.zIndex=depth.get(id)??0;};
  const motion=new PriestMotion(),meshes=[],anchors={},hands=[];
  let destroyed=false,running=false,fit=1,offsetX=0,offsetY=0,frames=0;
  let lastPose;
  function mesh(id,transform,{columns=13,rows=19,rect=null}={}){
    const a=data.assets[id],texture=textures[id],[w,h]=a.native,[rx,ry,rw,rh]=rect||[0,0,w,h];
    const vertices=new Float32Array(columns*rows*2),uvs=new Float32Array(vertices.length),points=[],indices=[];
    for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
      const i=y*columns+x,px=rx+rw*x/(columns-1),py=ry+rh*y/(rows-1);points.push({x:px,y:py});uvs[i*2]=px/w;uvs[i*2+1]=py/h;
      if(x<columns-1&&y<rows-1){const j=i+columns;indices.push(i,i+1,j,i+1,j+1,j);}
    }
    const display=new P.MeshSimple({texture,vertices,uvs,indices:new Uint32Array(indices)});display.autoUpdate=true;order(display,id);stage.addChild(display);
    meshes.push({display,points,transform});return display;
  }
  function torso(q,p){const strength=smooth((data.body.fixedBelow-4-(q.y-data.body.y)/data.body.scale)/780);const r=rotatePoint(q,{x:data.body.hinge[0],y:data.body.hinge[1]},p.torso*strength);r.y-=p.lift*strength;return r;}
  function bodyPoint(q,p){let r={x:q.x*data.body.scale+data.body.x,y:q.y*data.body.scale+data.body.y};r=torso(r,p);const weight=Math.sin(clamp((q.y-600)/830)*Math.PI);r.x+=p.cloth*weight;return r;}
  function headPoint(q,p){const h=data.head,pivot={x:h.x+h.pivot[0]*h.scale,y:h.y+h.pivot[1]*h.scale};return torso(rotatePoint({x:h.x+q.x*h.scale,y:h.y+q.y*h.scale},pivot,p.head),p);}
  function arm(q,p,side){return torso(armPoint(q,data[side],p[side+'Shoulder'],p[side+'Elbow'],true),p);}
  function wrist(p,side){const s=data[side];return armPoint({x:s.wrist[0],y:s.wrist[1]},s,p[side+'Shoulder'],p[side+'Elbow']);}
  function handPoint(q,p,side,id){
    const at=wrist(p,side),s=data[side+'Hand'],base=data.assets[side==='free'?'free-hand':'holding-hand-final'];
    const actual=data.assets[id];q={x:q.x*base.native[0]/actual.native[0],y:q.y*base.native[1]/actual.native[1]};
    const degrees=side==='free'?s.rotation+data.free.baseElbow+p.freeShoulder+p.freeElbow+p.wrist:(p.holdingShoulder+p.holdingElbow)*.15;
    return torso(rotatePoint({x:at.x+(q.x-s.pivot[0])*s.scale,y:at.y+(q.y-s.pivot[1])*s.scale},at,degrees),p);
  }
  function vesselBase(p){const w=wrist(p,'holding');return rotatePoint({x:w.x+data.vessel.fromWrist[0],y:w.y+data.vessel.fromWrist[1]},w,(p.holdingShoulder+p.holdingElbow)*.15);}
  function vesselPoint(q,p){const at=vesselBase(p),s=data.vessel;return torso(rotatePoint({x:at.x+(q.x-s.pivot[0])*s.scale,y:at.y+(q.y-s.pivot[1])*s.scale},at,(p.holdingShoulder+p.holdingElbow)*.15),p);}
  function rubyBase(p){const v=vesselBase(p);return {x:v.x+data.ruby.fromVessel[0]+Math.sin(p.time*1.7)*2,y:v.y+data.ruby.fromVessel[1]+Math.sin(p.time*2.2)*3-p.glow*5+(p.rubyLag||0)};}
  function rubyPoint(q,p){const at=rubyBase(p),s=data.ruby;return torso({x:at.x+(q.x-s.pivot[0])*s.scale,y:at.y+(q.y-s.pivot[1])*s.scale},p);}
  for(const id of ['feet','robe'])mesh(id,bodyPoint);
  for(const id of ['free-upperarm','free-forearm'])mesh(id,(q,p)=>arm(q,p,'free'));
  for(const id of ['free-cuff-back','free-cuff-front'])if(data.assets[id])mesh(id,(q,p)=>arm(q,p,'free'));
  if(data.assets['free-wrist-extension'])mesh('free-wrist-extension',(q,p)=>handPoint({x:q.x*data.freeWrist.scale+data.freeWrist.offset[0],y:q.y*data.freeWrist.scale+data.freeWrist.offset[1]},p,'free','free-hand'),{columns:2,rows:2});
  for(const id of ['torso','cape','stole','neck'])mesh(id,bodyPoint);
  for(const id of ['holding-upperarm','holding-forearm'])mesh(id,(q,p)=>arm(q,p,'holding'));
  mesh('head',headPoint,{columns:2,rows:2});
  const faceRect=data.head.facePatches.rect;
  const alertEyes=mesh('head-attentive',headPoint,{columns:2,rows:2,rect:faceRect});
  const closedEyes=mesh('head-blink',headPoint,{columns:2,rows:2,rect:faceRect});
  mesh('holding-hand-final',(q,p)=>handPoint(q,p,'holding','holding-hand-final'),{columns:2,rows:2});
  mesh('vessel',vesselPoint,{columns:2,rows:2});
  if(data.assets['holding-hand-front'])mesh('holding-hand-front',(q,p)=>handPoint(q,p,'holding','holding-hand-front'),{columns:2,rows:2});
  const chain=new P.Graphics();order(chain,'@chain');stage.addChild(chain);
  const glowCanvas=doc.createElement('canvas');glowCanvas.width=glowCanvas.height=128;
  const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,2,64,64,64);gradient.addColorStop(0,'#ff9a8666');gradient.addColorStop(.24,'#cf163966');gradient.addColorStop(1,'#c5103100');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const glow=new P.Sprite(P.Texture.from(glowCanvas));glow.anchor.set(.5);order(glow,'@ruby-glow');stage.addChild(glow);
  mesh('ruby',rubyPoint,{columns:2,rows:2});
  for(const id of ['free-hand','free-hand-between','free-hand-open']){
    const [w,h]=data.assets[id].native;
    hands.push(mesh(id,(q,p)=>handPoint(q,p,'free',id),{columns:2,rows:2,rect:[0,0,w,h*(data.freeHand.cropBottom??data.assets['free-hand'].native[1])/data.assets['free-hand'].native[1]]}));
  }
  function draw(p=motion.sample()){
    if(destroyed)return;
    for(const [key,range] of Object.entries(data.motionLimits))if(key in p)p[key]=clamp(p[key],range[0],range[1]);
    lastPose={...p};
    for(const {display,points,transform} of meshes){if(!display.visible&&display!==alertEyes&&display!==closedEyes&&!hands.includes(display))continue;const v=display.vertices;for(let i=0;i<points.length;i++){const q=transform(points[i],p);v[i*2]=q.x;v[i*2+1]=q.y;}}
    const handIndex=p.palm>.7?2:p.palm>.28?1:0;hands.forEach((h,i)=>h.visible=i===handIndex);
    alertEyes.visible=!p.blink&&p.attention>.4;closedEyes.visible=!!p.blink;
    anchors.freeHand=handPoint({x:800,y:500},p,'free','free-hand');
    anchors.vessel=vesselPoint({x:640,y:620},p);anchors.ruby=torso(rubyBase(p),p);anchors.head=headPoint({x:650,y:550},p);
    anchors.foot={x:500,y:1520};anchors.supportingHand=handPoint({x:800,y:650},p,'holding','holding-hand-final');
    anchors.vesselFoot=vesselPoint({x:640,y:1150},p);anchors.vesselGrip=handPoint({x:data.holdingHand.pivot[0]+data.vessel.fromWrist[0]/data.holdingHand.scale,y:data.holdingHand.pivot[1]+data.vessel.fromWrist[1]/data.holdingHand.scale},p,'holding','holding-hand-final');
    const tip=vesselPoint({x:640,y:90},p);chain.clear().moveTo(tip.x,tip.y).lineTo(anchors.ruby.x,anchors.ruby.y+17).stroke({width:1.3,color:0xc3b8a4,alpha:.58});
    glow.position.set(anchors.ruby.x,anchors.ruby.y);glow.width=glow.height=75+p.glow*70;glow.alpha=.25+p.glow*.7;
    app.render();frames++;
    root.dataset.reaction=motion.current?.name||'idle';
  }
  function layout(){if(destroyed)return;const w=Math.max(1,root.clientWidth),h=Math.max(1,root.clientHeight);fit=Math.min(w/1000,h/1600);offsetX=(w-1000*fit)/2;offsetY=(h-1600*fit)/2;stage.scale.set(fit);stage.position.set(offsetX,offsetY);app.renderer.resize(w,h);draw();}
  const resize=new win.ResizeObserver(layout);resize.observe(root);layout();
  function tick(_time,delta){if(destroyed||doc.hidden)return;draw(motion.advance(Math.min(delta/1000,.05)));}
  const lost=()=>{stop();root.dispatchEvent(new win.CustomEvent('riglost'));};app.canvas.addEventListener('webglcontextlost',lost);
  function start(){if(!running&&!destroyed){running=true;gsap.ticker.add(tick);}}
  function stop(){running=false;gsap.ticker.remove(tick);}
  return {motion,start,stop,draw,canvas:app.canvas,
    react(name,options){return motion.react(name,options);},
    anchor(name,relativeTo){const q=anchors[name];if(!q)return null;const r=root.getBoundingClientRect(),s=relativeTo?.getBoundingClientRect()||{left:0,top:0};return {x:r.left-s.left+offsetX+q.x*fit,y:r.top-s.top+offsetY+q.y*fit};},
    cancel(options){motion.cancel(options);draw();},
    reviewPose(values){stop();draw({...motion.sample(),...values});return {pose:lastPose,scale:fit};},
    reviewMasks(groups){
      const visible=new Map(stage.children.map(child=>[child,child.visible])),images={};
      try{for(const [name,ids] of Object.entries(groups)){for(const child of stage.children)child.visible=visible.get(child)&&ids.includes(child.label);app.render();images[name]=app.canvas.toDataURL('image/png');}}finally{for(const [child,value] of visible)child.visible=value;app.render();}
      return images;
    },
    inspect(){return {...motion.snapshot(),version:data.version,frames,anchors:structuredClone(anchors),parts:meshes.length,scale:fit,running,drawOrder:stage.children.map(child=>child.label)};},
    destroy(){if(destroyed)return;stop();destroyed=true;resize.disconnect();app.canvas.removeEventListener('webglcontextlost',lost);app.destroy(true,{children:true,texture:false,textureSource:false});}
  };
}
