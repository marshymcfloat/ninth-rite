export const REACTION_PRIORITY={spin:.2,win:.3,offering:.4,altar:1,bonus:2,invocation:3,benediction:4,expiry:4,celebration:2};
const aliases={invoke:'invocation',confirmed:'benediction',expired:'expiry'};
export const MOTION_CHANNELS=['torso','head','lift','freeShoulder','freeElbow','holdingShoulder','holdingElbow','wrist','palm','attention','glow'];
const zero=()=>Object.fromEntries(MOTION_CHANNELS.map(k=>[k,0]));
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export const GESTURES={
  spin:{duration:.72,attack:.18,hold:.25,pose:{torso:-1.3,head:5,attention:.6,freeElbow:3}},
  win:{duration:.85,attack:.22,hold:.22,pose:{head:4,holdingElbow:6,holdingShoulder:2,glow:.7,lift:2}},
  offering:{duration:.65,attack:.18,hold:.15,pose:{wrist:8,freeElbow:5,holdingElbow:4,glow:1}},
  altar:{duration:1.15,attack:.28,hold:.3,pose:{head:7,freeShoulder:7,freeElbow:10,wrist:-9,palm:.5,attention:.8,glow:.8}},
  bonus:{duration:1.8,attack:.45,hold:.55,pose:{torso:-2,head:11,freeShoulder:25,freeElbow:0,wrist:-18,palm:1,holdingShoulder:2,holdingElbow:7,attention:1,glow:.65,lift:4}},
  invocation:{duration:1.65,attack:.48,hold:.65,pose:{torso:-2,head:12,freeShoulder:32,freeElbow:4,wrist:-24,palm:1,holdingShoulder:3,holdingElbow:8,attention:1,glow:1,lift:5}},
  benediction:{duration:1.25,attack:.24,hold:.32,pose:{torso:-1.7,head:5,freeShoulder:13,freeElbow:-5,wrist:-15,palm:.8,holdingElbow:3,attention:.8,glow:1,lift:2}},
  expiry:{duration:1.1,attack:.3,hold:.2,pose:{torso:1,head:-10,freeShoulder:-5,freeElbow:-10,wrist:7,palm:0,attention:0,glow:0,lift:-1}},
  celebration:{duration:2.3,attack:.55,hold:.85,pose:{torso:-2.5,head:12,freeShoulder:34,freeElbow:5,wrist:-24,palm:1,holdingElbow:9,attention:1,glow:1,lift:5}},
};

export class PriestMotion{
  constructor({seed=913}={}){this.time=0;this.pose=zero();this.velocity=zero();this.current=null;this.pending=false;this.seen=new Set();this.seed=seed;this.blinkAt=3.3;this.blinkEnd=0;this.idleAt=4.5;this.idleGesture=null;this.count=0;this.speed=1;}
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
  react(raw,{key,priority,intensity=1}={}){
    const name=aliases[raw]||raw,spec=GESTURES[name],p=priority??REACTION_PRIORITY[name]??0;
    if(!spec||key&&this.seen.has(key))return false;
    if(key){this.seen.add(key);if(this.seen.size>256)this.seen.delete(this.seen.values().next().value);}
    if(this.current&&p<this.current.priority||this.current?.name===name&&(!key||p<1&&this.current.age<.4))return false;
    this.current={name,key,priority:p,age:0,spec,from:{...this.pose},intensity:clamp(intensity,.6,1.25)};this.count++;
    this.idleGesture=null;this.idleAt=this.time+4+this.random()*4;
    if(name==='benediction'||name==='expiry')this.pending=false;
    return true;
  }
  beginRound(){this.seen.clear();}
  setPending(value){this.pending=!!value;}
  settle(){if(this.current?.name==='invocation')this.current.priority=4;}
  cancel({hard=true}={}){this.current=null;this.pending=false;this.idleGesture=null;if(hard){this.pose=zero();this.velocity=zero();}this.idleAt=this.time+5;}
  advance(dt){
    dt=clamp(dt,0,.05);this.time+=dt;
    if(this.time>=this.blinkAt){this.blinkEnd=this.time+.16;this.blinkAt=this.time+3+this.random()*4;}
    this.blink=this.time<this.blinkEnd;
    if(!this.current&&!this.pending&&this.time>=this.idleAt){this.idleGesture={start:this.time,kind:Math.floor(this.random()*3)};this.idleAt=this.time+4+this.random()*4;}
    const target=zero();
    if(this.pending)Object.assign(target,{head:4,freeShoulder:6,freeElbow:8,wrist:-3,palm:.2,attention:.65,glow:.25,lift:1});
    if(this.idleGesture){const age=this.time-this.idleGesture.start,envelope=Math.sin(clamp(age/2)*Math.PI);if(age>=2)this.idleGesture=null;else{
      const variant=this.idleGesture.kind;target.head=(variant===0?6:variant===1?-4:2)*envelope;target.freeElbow=(variant===2?8:2)*envelope;target.wrist=variant===2?-7*envelope:0;target.attention=variant===0?.7*envelope:0;
    }}
    const active=this.current;
    if(active){active.age+=dt*this.speed;const {duration,attack,hold,pose}=active.spec;
      const release=duration-attack-hold;
      const weight=active.age<attack?smooth(active.age/attack):active.age<attack+hold?1:1-smooth((active.age-attack-hold)/release);
      for(const k of MOTION_CHANNELS){const gesture=(pose[k]||0)*active.intensity;target[k]=active.age<attack?active.from[k]*(1-weight)+(target[k]+gesture)*weight:target[k]+gesture*weight;}
      if(active.name==='benediction'||active.name==='altar')target.head-=Math.sin(clamp((active.age-.25)/.55)*Math.PI)*6;
      if(active.age>=duration)this.current=null;
    }
    // Critically damped pose channels retain velocity when another gesture interrupts.
    const omega=25,decay=Math.exp(-omega*dt);
    for(const k of MOTION_CHANNELS){const d=this.pose[k]-target[k],v=this.velocity[k],c=v+omega*d;this.pose[k]=target[k]+(d+c*dt)*decay;this.velocity[k]=(v-omega*c*dt)*decay;}
    return this.sample();
  }
  sample(){const t=this.time,p={...this.pose};p.head+=Math.sin(t*.76)*1.1;p.torso+=Math.sin(t*.42)*.32;p.lift+=Math.sin(t*1.36)*2.5;p.freeElbow+=Math.sin(t*.95+.5)*1.5;p.holdingElbow+=Math.sin(t*1.36+.5)*.7;p.cloth=Math.sin(t*1.3-.8)*2.2+clamp(this.velocity.torso*.35+this.velocity.freeShoulder*.018,-4,4);p.rubyLag=clamp(-this.velocity.holdingElbow*.1,-3,3);p.blink=this.blink;p.time=t;return p;}
  snapshot(){return {time:this.time,reaction:this.current?.name||'idle',priority:this.current?.priority??0,pending:this.pending,count:this.count,pose:{...this.pose},velocity:{...this.velocity}};}
}

export const radians=degrees=>degrees*Math.PI/180;
export function rotatePoint(point,pivot,degrees){const a=radians(degrees),c=Math.cos(a),s=Math.sin(a),x=point.x-pivot.x,y=point.y-pivot.y;return {x:pivot.x+x*c-y*s,y:pivot.y+x*s+y*c};}
const distanceSegment=(p,a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],t=clamp(((p.x-a[0])*x+(p.y-a[1])*y)/(x*x+y*y));return Math.hypot(p.x-a[0]-x*t,p.y-a[1]-y*t);};
export function armPoint(p,spec,shoulderAngle=0,elbowAngle=0,skin=false){
  elbowAngle+=spec.baseElbow||0;
  const shoulder={x:spec.shoulder[0],y:spec.shoulder[1]},elbow={x:spec.elbow[0],y:spec.elbow[1]};
  let q=rotatePoint(p,elbow,elbowAngle);
  if(skin){const up=distanceSegment(p,spec.shoulder,spec.elbow),fore=distanceSegment(p,spec.elbow,spec.wrist);let w=smooth((up/(up+fore+.001)-.12)/.76);if(spec.rigidCuff&&p.y>spec.rigidCuff.minY)w=Math.max(w,smooth((spec.rigidCuff.blendEnd-p.x)/(spec.rigidCuff.blendEnd-spec.rigidCuff.end)));q={x:p.x+(q.x-p.x)*w,y:p.y+(q.y-p.y)*w};}
  q=rotatePoint(q,shoulder,shoulderAngle);return {x:spec.at[0]+(q.x-shoulder.x)*spec.scale,y:spec.at[1]+(q.y-shoulder.y)*spec.scale};
}
