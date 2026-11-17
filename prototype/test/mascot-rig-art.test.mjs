import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {rotatePoint,armPoint} from '../public/style-2/mascot-motion.mjs';

const root=new URL('../',import.meta.url),cache=new Map();
async function png(path){
  if(cache.has(path))return cache.get(path);
  const b=await readFile(new URL(path,root)),chunks=[];let width,height;
  assert.equal(b.subarray(1,4).toString(),'PNG');
  for(let p=8;p<b.length;){const n=b.readUInt32BE(p),type=b.toString('ascii',p+4,p+8),data=b.subarray(p+8,p+8+n);p+=n+12;
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert.equal(data[9],6);assert.equal(data[12],0);}
    if(type==='IDAT')chunks.push(data);
  }
  const raw=inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
  for(let y=0;y<height;y++){const start=y*(stride+1),filter=raw[start];assert.ok(filter<=4);
    for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=4?pixels[i-4]:0,b=y?pixels[i-stride]:0,c=y&&x>=4?pixels[i-stride-4]:0;
      pixels[i]=(raw[start+1+x]+([0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter]))&255;
    }
  }
  const result={width,height,pixels,alpha(x,y){x=Math.round(x);y=Math.round(y);return x<0||y<0||x>=width||y>=height?0:pixels[(y*width+x)*4+3];}};
  cache.set(path,result);return result;
}
const v1='art/style-2/engraved-rig-v1/sources/',v2='art/style-2/engraved-rig-v2/sources/';
const rig=JSON.parse(await readFile(new URL('public/style-2/media/engraved-rig-v2/rig.json',root)));
function sleevePoint(q,wrist){const local=rotatePoint({x:(q.x-rig.freeHand.pivot[0])*rig.freeHand.scale/rig.free.scale,y:(q.y-rig.freeHand.pivot[1])*rig.freeHand.scale/rig.free.scale},{x:0,y:0},rig.freeHand.rotation+wrist);return {x:local.x+rig.free.wrist[0],y:local.y+rig.free.wrist[1]};}
function wristPoint(q){return {x:q.x*rig.freeWrist.scale+rig.freeWrist.offset[0],y:q.y*rig.freeWrist.scale+rig.freeWrist.offset[1]};}

test('v2 retains the three hand drawings at uniform +20% scale with the entire wrist available',async()=>{
  const old=JSON.parse(await readFile(new URL('public/style-2/media/engraved-rig-v1/rig.json',root)));
  assert.equal(rig.freeHand.scale,old.freeHand.scale*1.2);assert.equal(rig.freeHand.cropBottom,null);
  for(const id of ['free-hand','free-hand-between','free-hand-open']){
    for(const key of ['url','native','runtime','bytes'])assert.deepEqual(rig.assets[id][key],old.assets[id][key]);const source=await png(v1+id+'.png');let extra=0;
    for(let y=1051;y<source.height;y++)for(let x=0;x<source.width;x++)if(source.alpha(x,y)>220)extra++;
    assert.ok(extra>20000,'the restored wrist must contain actual opaque anatomy');
  }
});
test('split hand and sleeve alpha masks retain the source silhouette without new opaque pixels',async()=>{
  for(const [original,parts,predicate] of [
    ['holding-hand-final',['holding-hand-final','holding-hand-front'],()=>true],
    ['free-sleeve',['free-forearm','free-cuff-back','free-cuff-front'],(x,y)=>y>800||x<540]
  ]){
    const src=await png(v1+original+'.png'),layers=await Promise.all(parts.map(id=>png(v2+id+'.png')));let opaque=0,missing=0,extra=0;
    for(let y=0;y<src.height;y+=2)for(let x=0;x<src.width;x+=2){const a=src.alpha(x,y),out=Math.max(...layers.map(l=>l.alpha(x,y)));if(a>220&&predicate(x,y)){opaque++;if(out<220)missing++;}if(a===0&&out>0)extra++;}
    assert.equal(extra,0);assert.equal(missing,0,`${original}: ${missing}/${opaque} opaque source pixels were lost`);
  }
});
test('actual finger alpha overlaps the chalice base and leaves the bowl unobstructed',async()=>{
  const front=await png(v2+'holding-hand-front.png'),vessel=await png(v1+'vessel.png');let overlap=0,upperOverlap=0;
  for(let y=0;y<vessel.height;y+=2)for(let x=0;x<vessel.width;x+=2){if(vessel.alpha(x,y)<220)continue;
    const hx=rig.holdingHand.pivot[0]+(rig.vessel.fromWrist[0]+(x-rig.vessel.pivot[0])*rig.vessel.scale)/rig.holdingHand.scale;
    const hy=rig.holdingHand.pivot[1]+(rig.vessel.fromWrist[1]+(y-rig.vessel.pivot[1])*rig.vessel.scale)/rig.holdingHand.scale;
    if(front.alpha(hx,hy)>220){overlap++;if(y<950)upperOverlap++;}
  }
  assert.ok(overlap>500,`only ${overlap} contact pixels`);assert.equal(upperOverlap,0,'foreground fingers cover the chalice bowl');
  assert.ok(rig.drawOrder.indexOf('holding-hand-final')<rig.drawOrder.indexOf('vessel'));
  assert.ok(rig.drawOrder.indexOf('vessel')<rig.drawOrder.indexOf('holding-hand-front'));
});
test('generated wrist joins and cut edges stay covered by real hand/cuff pixels across the wrist range',async()=>{
  const extension=await png(v2+'free-wrist-extension.png'),cuff=await png(v2+'free-cuff-front.png');
  const hands=await Promise.all(['free-hand','free-hand-between','free-hand-open'].map(id=>png(v1+id+'.png')));
  const top=rig.freeWrist.crop[1],bottom=top+rig.freeWrist.crop[3];let topSamples=0,topMiss=0;
  for(let x=0;x<extension.width;x+=4){if(extension.alpha(x,top)<220)continue;const q=wristPoint({x,y:top});topSamples++;if(hands.some(h=>h.alpha(q.x*h.width/hands[0].width,q.y)<200))topMiss++;}
  assert.ok(topSamples>50);assert.ok(topMiss/topSamples<.02,`${topMiss}/${topSamples} generated top-cut pixels exposed`);
  for(const wrist of [-24,-12,0,8,24]){
    let n=0,miss=0;for(let x=0;x<extension.width;x+=4){if(extension.alpha(x,bottom)<220)continue;n++;const p=sleevePoint(wristPoint({x,y:bottom}),wrist);if(cuff.alpha(p.x,p.y)<200)miss++;}
    assert.ok(n>50);assert.ok(miss/n<.02,`${wrist}deg: ${miss}/${n} wrist extension cut pixels exposed`);
    for(const hand of hands){let samples=0,exposed=0;for(let x=100;x<=420;x+=10){let y=hand.height-1;while(y>1000&&hand.alpha(x,y)<220)y--;if(y<=1000)continue;const q={x:x*hands[0].width/hand.width,y},p=sleevePoint(q,wrist);const e=extension.alpha((q.x-rig.freeWrist.offset[0])/rig.freeWrist.scale,(q.y-rig.freeWrist.offset[1])/rig.freeWrist.scale);samples++;if(e<200&&cuff.alpha(p.x,p.y)<200)exposed++;}
      assert.ok(samples>20);assert.equal(exposed,0,`${wrist}deg: ${exposed} original hand cut pixels uncovered`);
    }
  }
});
test('v2 cuff opening remains rigid and layer order keeps its rim in front through all arm poses',()=>{
  for(const shoulder of [-12,0,38])for(const elbow of [-20,0,32])for(const q of [{x:140,y:730},{x:265,y:775},{x:350,y:950}]){
    const skin=armPoint(q,rig.free,shoulder,elbow,true),rigid=armPoint(q,rig.free,shoulder,elbow);
    assert.ok(Math.hypot(skin.x-rigid.x,skin.y-rigid.y)<1e-8);
  }
  const order=rig.drawOrder;
  assert.ok(order.indexOf('free-upperarm')<order.indexOf('cape'));
  for(const id of ['free-hand','free-hand-between','free-hand-open'])assert.ok(order.indexOf('free-cuff-back')<order.indexOf(id)&&order.indexOf(id)<order.indexOf('free-cuff-front'));
  assert.ok(order.indexOf('torso')<order.indexOf('free-forearm'));
});
