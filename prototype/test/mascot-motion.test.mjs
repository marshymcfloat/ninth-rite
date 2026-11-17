import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PriestMotion,armPoint,MOTION_CHANNELS} from '../public/style-2/mascot-motion.mjs';

const advance=(motion,seconds)=>{for(let i=0;i<Math.round(seconds*120);i++)motion.advance(1/120);};
test('interruption preserves pose and velocity, blends from the current hand position and discards stale gestures',()=>{
  const m=new PriestMotion();m.setPending(true);m.react('invocation',{key:'invoke'});advance(m,.5);
  const before=m.snapshot();assert.ok(before.pose.freeShoulder>20);
  assert.equal(m.react('benediction',{key:'confirm'}),true);
  assert.deepEqual(m.pose,before.pose);assert.deepEqual(m.velocity,before.velocity);
  m.advance(.001);assert.ok(Math.abs(m.pose.freeShoulder-before.pose.freeShoulder)<.1);
  assert.equal(m.react('bonus',{key:'stale'}),false);
  assert.equal(m.react('benediction',{key:'confirm'}),false);
  advance(m,2);assert.equal(m.snapshot().reaction,'idle');assert.equal(m.pending,false);
  assert.equal(m.react('bonus',{key:'stale'}),false,'discarded events cannot replay after priority clears');
  assert.equal(m.count,2);
});
test('round boundaries preserve idle phase; cancellation clears held offers without replaying a gesture',()=>{
  const m=new PriestMotion();advance(m,2);m.react('win',{key:'win'});advance(m,.2);
  const before=m.snapshot(),age=m.current.age;m.beginRound();assert.equal(m.time,before.time);assert.equal(m.current.age,age);
  assert.deepEqual(m.pose,before.pose);m.setPending(true);m.cancel();
  assert.equal(m.time,before.time);assert.equal(m.pending,false);assert.equal(m.current,null);
  advance(m,3);assert.equal(m.count,1);assert.equal(m.snapshot().reaction,'idle');
  assert.ok(MOTION_CHANNELS.every(k=>Number.isFinite(m.sample()[k])));
});
test('pending and deferred holds do not invoke again and keep blinking',()=>{
  const m=new PriestMotion();m.react('invocation',{key:'offer'});m.setPending(true);advance(m,2);
  const count=m.count;m.setPending(true);let blinks=0,was=false;
  for(let i=0;i<1200;i++){m.advance(1/120);if(m.blink&&!was)blinks++;was=m.blink;}
  assert.equal(m.count,count);assert.equal(m.current,null);assert.ok(m.pose.freeShoulder>5);assert.ok(blinks>=2&&blinks<=4);
  m.setPending(false);m.react('expiry',{key:'expired'});advance(m,2);assert.equal(m.pending,false);assert.ok(Math.abs(m.pose.freeShoulder)<.01);
});
test('shoulder and cuff attachments remain coincident throughout permitted arm motion',async()=>{
  const rig=JSON.parse(await readFile(new URL('../public/style-2/media/engraved-rig-v1/rig.json',import.meta.url)));
  for(const side of ['free','holding'])for(const shoulder of [-7,0,8])for(const elbow of [-12,0,12]){
    const s=rig[side],joint=armPoint({x:s.shoulder[0],y:s.shoulder[1]},s,shoulder,elbow,true);
    assert.ok(Math.hypot(joint.x-s.at[0],joint.y-s.at[1])<1e-8);
    const p={x:s.wrist[0],y:s.wrist[1]},skin=armPoint(p,s,shoulder,elbow,true),hand=armPoint(p,s,shoulder,elbow);
    assert.ok(Math.hypot(skin.x-hand.x,skin.y-hand.y)<1e-8,'cuff cannot separate from hand');
  }
});
