import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {ART} from '../public/style-2/art-data.mjs';
import {applyArt,artBox,getArt,symbolArtUrl} from '../public/style-2/art.mjs';
import {frameSvg} from '../public/style-2/frame-layout.mjs';

test('every runtime engraving is an unchanged optimized export with complete optical metadata',async()=>{
  assert.equal(Object.keys(ART).length,40);
  for(const [id,asset] of Object.entries(ART)){
    const [runtime,source]=await Promise.all([
      readFile(new URL('../public'+asset.url,import.meta.url)),
      readFile(new URL('../art/style-2/engraved-v1/assets/'+id+'.webp',import.meta.url))
    ]);
    assert.equal(runtime.length,asset.bytes,id+' byte count');
    assert.equal(createHash('sha256').update(runtime).digest('hex'),createHash('sha256').update(source).digest('hex'),id+' source preservation');
    const [l,t,r,b]=asset.bounds;
    assert.ok(l>=0&&t>=0&&r<=asset.width&&b<=asset.height&&r>l&&b>t,id+' optical bounds');
  }
  assert.equal(new Set(['C1','C2','C3','C4','P1','P2','P3','P4','S'].map(symbolArtUrl)).size,9);
});

test('symbol optical fitting respects padding without stretching proportions',()=>{
  for(const id of Object.keys(ART).filter(id=>id.startsWith('symbol-'))){
    const asset=getArt(id),box=artBox(id,150,105,.94),[l,t,r,b]=asset.bounds;
    assert.ok(Math.abs(box.width/asset.width-box.height/asset.height)<1e-9);
    const visible={left:box.left+l*box.scale,right:box.left+r*box.scale,top:box.top+t*box.scale,bottom:box.top+b*box.scale};
    assert.ok(visible.left>=0&&visible.top>=0&&visible.right<=150&&visible.bottom<=105,id);
    assert.ok(Math.abs((visible.left+visible.right)/2-75)<1e-9);
    assert.ok(Math.abs((visible.top+visible.bottom)/2-52.5)<1e-9);
  }
});

test('optical art updates on resize and releases a removed board image',async t=>{
  const dom=new JSDOM('<div id="cell"><img></div>',{pretendToBeVisual:true});t.after(()=>dom.window.close());
  const container=dom.window.document.getElementById('cell'),image=container.querySelector('img');let width=150;
  Object.defineProperties(container,{clientWidth:{get:()=>width},clientHeight:{value:105}});
  const cleanup=applyArt(image,'symbol-j');
  const frame=()=>new Promise(resolve=>dom.window.requestAnimationFrame(resolve));await frame();
  assert.equal(image.style.maxHeight,'none');assert.equal(image.style.maxWidth,'none');
  const firstLeft=image.style.left;width=300;dom.window.dispatchEvent(new dom.window.Event('resize'));await frame();
  assert.notEqual(image.style.left,firstLeft);
  image.remove();const lastLeft=image.style.left;width=450;dom.window.dispatchEvent(new dom.window.Event('resize'));await frame();
  assert.equal(image.style.left,lastLeft);cleanup();assert.doesNotThrow(()=>applyArt(null,'symbol-j'));
});

test('prepared symbols retain optical registration through an exit delay and survivor reparenting',async t=>{
  const dom=new JSDOM('<main id="board"></main>',{pretendToBeVisual:true});t.after(()=>dom.window.close());
  const {document}=dom.window,board=document.getElementById('board');
  const token=document.createElement('div'),image=document.createElement('img');token.append(image);
  Object.defineProperties(token,{clientWidth:{value:150},clientHeight:{value:105}});
  applyArt(image,'symbol-j',{container:token,occupancy:.87});
  const frame=()=>new Promise(resolve=>dom.window.requestAnimationFrame(resolve));
  await frame();await frame();assert.equal(image.style.width,'','prepared during the old board exit');
  board.append(token);await frame();await frame();
  const expected=artBox('symbol-j',150,105,.87);
  assert.equal(image.style.width,expected.width+'px');assert.equal(image.style.left,expected.left+'px');
  const nextCell=document.createElement('div');board.replaceChildren(nextCell);nextCell.append(token);
  await frame();assert.equal(image.style.width,expected.width+'px');assert.equal(image.style.left,expected.left+'px');
});

test('frame tiles rails and keeps every ornament uniformly scaled at desktop and narrow ratios',()=>{
  for(const [width,height] of [[1010,596],[680,400],[360,420]]){
    const dom=new JSDOM(frameSvg(width,height,99),{contentType:'image/svg+xml'});
    const root=dom.window.document.documentElement;
    assert.equal(root.getAttribute('viewBox'),`0 0 ${width} ${height}`);
    assert.equal(root.querySelectorAll('pattern').length,4);
    const ratios=[...root.querySelectorAll('svg')].map(svg=>{
      const [,,w,h]=svg.getAttribute('viewBox').split(' ').map(Number);
      const x=Number(svg.getAttribute('width'))/w,y=Number(svg.getAttribute('height'))/h;
      assert.ok(Math.abs(x-y)<1e-9,'ornament proportions');return x;
    });
    assert.ok(ratios.every(ratio=>Math.abs(ratio-ratios[0])<1e-9),'one ornament scale');
    dom.window.close();
  }
});
