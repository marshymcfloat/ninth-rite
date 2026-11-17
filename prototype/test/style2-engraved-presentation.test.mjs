import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createPresentation,celebrationAmountBox} from '../public/style-2/game-view.mjs';
import {initialPlayback,applyRecordedEvent} from '../public/style-2/playback.mjs';
import {MODES,RULES} from '../rules-v19.mjs';
import {TIERS} from '../config.mjs';
import {quietBoard} from '../scenarios.mjs';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
function fixture(t){
  const dom=new JSDOM(html,{pretendToBeVisual:true}),document=dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
  t.after(()=>dom.window.close());
  const config={rules:RULES,modes:MODES,tiers:TIERS,initialBoard:quietBoard()};
  const view=createPresentation({document,config,mascot:{react(){},cancel(){}},options:()=>({reduced:true,fast:true}),format:n=>Number(n).toFixed(2)});
  const book={mode:'base',bet:1,cost:1,payout:0,rules:RULES,events:[]};
  const model={...initialPlayback(book,config),state:{tier:16,blood:2,offerings:1,sealed:false},feature:true};
  return {document,view,model,book,config};
}
async function inspectDialog(view,event,model,book,document,inspect){
  const pending=view.event(event,model,book),dialog=document.getElementById('featureDialog');
  for(let attempt=0;!dialog.open&&attempt<10;attempt++)await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(dialog.open,true);inspect(dialog);
  document.getElementById('featureContinue').click();await pending;
}

test('engraved symbols and paired mechanic states keep earned ladder separate from pending value',async t=>{
  const {document,view,model}=fixture(t),symbols=['C1','C2','C3','C4','P1','P2','P3','P4','S'];
  const board=quietBoard().map((row,r)=>row.map((cell,c)=>({...cell,symbol:symbols[(r*6+c)%symbols.length],marked:r===0&&c===0})));
  await view.board(board,null,{still:true});
  const images=[...document.querySelectorAll('.symbol-image')];
  assert.equal(new Set(images.map(img=>img.src)).size,9);
  assert.ok(images.every(img=>img.src.includes('/engraved-v1/symbol-')));
  assert.match(document.querySelector('.mark img').src,/engraved-v1\/offering-mark.webp$/);
  view.readouts({...model,pending:250});
  for(const [id,prefix,filled] of [['blood','blood',2],['offerings','offering',1]]){
    assert.match(document.querySelector(`#${id} .meter-base`).src,new RegExp(`${prefix}-empty.webp$`));
    assert.match(document.querySelector(`#${id} .meter-fill img`).src,new RegExp(`${prefix}-filled.webp$`));
    assert.equal(document.querySelectorAll(`#${id} .filled`).length,filled);
  }
  assert.equal(document.getElementById('multiplier').textContent,'×16');
  assert.equal(document.querySelector('#pending strong').textContent,'×250');
  assert.equal(document.querySelector('#altarLadder [aria-current=step]').textContent,'×16');
  assert.equal(document.querySelector('#altarLadder [data-tier="250"]').className,'upcoming');
  view.readouts({...model,state:{...model.state,tier:64},pending:null});
  assert.equal(document.querySelector('#altarLadder [aria-current=step]').textContent,'×64');
});

test('purchased and natural entries use mode artwork; retriggers, results and skip reset the environment',async t=>{
  const {document,view,model,book}=fixture(t);
  for(const [index,mode] of ['lesser','blood','greater','god'].entries()){
    const round={...book,mode,cost:MODES[mode].cost};view.begin(round,model,{instant:false,replay:false});
    const event={type:'featureStart',mode,spins:MODES[mode].spins,natural:index%2===1,state:{...model.state,tier:MODES[mode].tier}},state=applyRecordedEvent(model,event,round);
    await inspectDialog(view,event,state,round,document,dialog=>{
      assert.equal(dialog.dataset.art,mode==='god'?'rite-god':`bonus-entry-${mode}`);assert.equal(dialog.dataset.kind,'entry');
      assert.equal(dialog.hasAttribute('data-bonus-reveal'),mode!=='god');
      assert.equal(document.querySelector('.scene').dataset.environment,mode==='god'?'god':'bonus');
      assert.equal(document.getElementById('featureAltarValue').textContent,`×${MODES[mode].tier}`);
    });
    await inspectDialog(view,{type:'retrigger',added:5,remaining:11},state,round,document,dialog=>{
      assert.equal(dialog.dataset.art,mode==='god'?'symbol-scatter':'bonus-retrigger');
      assert.equal(dialog.hasAttribute('data-bonus-reveal'),mode!=='god');
      assert.equal(document.getElementById('featureValue').textContent,'+5');
      assert.match(document.getElementById('featureDetail').textContent,/^11 spins remain/);
    });
    await inspectDialog(view,{type:'roundEnd'},state,round,document,dialog=>{
      assert.equal(dialog.dataset.art,'result-ledger');assert.equal(dialog.dataset.kind,'result');
      assert.equal(document.getElementById('featureDetail').hidden,true);
      assert.equal(document.getElementById('featureValue').textContent,'0.00');
    });
    view.skip();view.end(round,state);
    assert.equal(document.querySelector('.scene').dataset.environment,'base');
    assert.equal(document.getElementById('featureDialog').open,false);
  }
});

test('base wins, paid bonus results and the cap select their own reveal artwork',async t=>{
  const {document,view,model,book}=fixture(t);
  for(const [payout,tier] of [[10,'big'],[25,'mega'],[50,'epic'],[100,'divine']]){
    const round={...book,payout};view.begin(round,model,{instant:false,replay:true});
    await inspectDialog(view,{type:'roundEnd'},model,round,document,dialog=>{
      assert.equal(dialog.dataset.kind,'celebration');assert.equal(dialog.dataset.art,`win-${tier}`);
      assert.equal(document.getElementById('featureValue').textContent,payout.toFixed(2));
    });
  }
  const lowReturn={...book,mode:'lesser',bet:5,cost:500,payout:400};
  view.begin(lowReturn,model,{instant:false,replay:false});
  await inspectDialog(view,{type:'featureStart',mode:'lesser',spins:10,state:model.state},model,lowReturn,document,()=>{});
  await inspectDialog(view,{type:'roundEnd'},model,lowReturn,document,dialog=>{
    assert.equal(dialog.dataset.kind,'result');
    assert.equal(dialog.dataset.art,'result-ledger');
    assert.equal(document.getElementById('featureTitle').textContent,'Round return');
    assert.equal(document.getElementById('featureValue').textContent,'400.00');
  });
  const bonus={...book,mode:'greater',bet:5,cost:2500,payout:8350.2};
  view.begin(bonus,model,{instant:false,replay:true});
  const start={type:'featureStart',mode:'greater',spins:12,state:model.state};
  await inspectDialog(view,start,model,bonus,document,()=>{});
  await inspectDialog(view,{type:'roundEnd'},model,bonus,document,dialog=>{
    assert.equal(dialog.dataset.winTier,'divine');
    assert.equal(dialog.dataset.art,'win-divine');
    assert.equal(document.getElementById('featureValue').textContent,'8350.20');
  });
  const round={...book,payout:50000};view.begin(round,model,{instant:false,replay:false});
  await view.event({type:'winCap'},model,round);
  await inspectDialog(view,{type:'roundEnd'},model,round,document,dialog=>{
    assert.equal(dialog.dataset.kind,'cap');assert.equal(dialog.dataset.art,'win-max');
    assert.equal(document.getElementById('featureTitle').textContent,'Max Win');
    assert.equal(document.getElementById('featureValue').textContent,'50000.00');
  });
});

test('celebration amount registration accounts for artwork padding and container shape',()=>{
  for(const id of ['win-big','win-mega','win-epic','win-divine'])for(const [width,height] of [[900,520],[560,650],[380,260]]){
    const area=celebrationAmountBox(id,width,height);
    assert.ok(area.left>0&&area.top>0&&area.width>0&&area.height>0);
    assert.ok(area.left+area.width<width&&area.top+area.height<height);
  }
  assert.equal(celebrationAmountBox('win-cap',900,520),null,'cap amount stays outside its shallow decorative plaque');
});
