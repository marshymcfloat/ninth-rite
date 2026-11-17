import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createSceneMotion} from '../public/style-2/scene-motion.mjs';

test('dismissed amount count-ups resolve exactly and cannot write after cancellation',async t=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{pretendToBeVisual:true,runScripts:'outside-only'}),doc=dom.window.document;
  dom.window.eval(await readFile(new URL('../public/vendor/gsap.min.js',import.meta.url),'utf8'));
  const gsap=dom.window.gsap;let reduced=false;
  const motion=createSceneMotion({document:doc,gsap,options:()=>({reduced})}),value=doc.getElementById('featureValue');
  t.after(()=>{motion.destroy();gsap.globalTimeline.clear();gsap.ticker.sleep();dom.window.close();});
  const fx=motion.ceremony(doc.getElementById('featureDialog'),{kind:'celebration',tier:'divine',amount:12345.67,format:n=>n.toFixed(2),finalText:'12,345.67'});
  assert.equal(value.textContent,'0.00');assert.ok(doc.querySelector('.feature-sparks i'));
  fx.finish();fx.finish();assert.equal(value.textContent,'12,345.67');assert.equal(doc.querySelectorAll('.feature-sparks,.feature-light-reveal').length,0);
  await new Promise(resolve=>setTimeout(resolve,80));assert.equal(value.textContent,'12,345.67');
  motion.ceremony(doc.getElementById('featureDialog'),{kind:'cap',tier:'cap',amount:50000,format:n=>n.toFixed(2),finalText:'50,000.00'});
  reduced=true;doc.querySelector('.scene').classList.add('motion-paused');await Promise.resolve();
  assert.equal(doc.querySelector('.chapel-life').hidden,true);
  assert.equal(value.textContent,'50,000.00');
  motion.ceremony(doc.getElementById('featureDialog'),{kind:'result',amount:0,format:String,finalText:'0.00'}).finish();
  assert.equal(value.textContent,'0.00');assert.equal(doc.querySelectorAll('.feature-sparks').length,0);
});
