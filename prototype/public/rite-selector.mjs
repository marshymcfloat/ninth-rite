const details = {
  base: { group:'chance', emblem:'IX', badge:'STANDARD PLAY', stat:'1 paid spin', tier:'Altar ×1', text:'Standard play. Three or more simultaneous scatters can unlock a bonus after the cascade chain.' },
  ante_15: { group:'chance', emblem:'I', badge:'SCATTER BOOST', stat:'Enhanced chance', tier:'Altar ×1', text:'Increased scatter chance for each paid spin. Bonus entry is not guaranteed. No Offering marks in base play.' },
  ante_30: { group:'chance', emblem:'II', badge:'SCATTER BOOST', stat:'Maximum chance', tier:'Altar ×1', text:'The higher scatter-chance option for each paid spin. Bonus entry is not guaranteed. No Offering marks in base play.' },
  lesser: { group:'bonus', emblem:'I', badge:'10 FREE SPINS', stat:'10 free spins', tier:'Start at ×8', text:'Begin with 10 free spins at altar ×8. Marked winning symbols collect Offerings; three invoke the entity.' },
  blood: { group:'bonus', emblem:'II', badge:'12 FREE SPINS', stat:'12 free spins', tier:'Start at ×16', text:'Begin with 12 free spins at altar ×16. Altar progression and banked Offerings persist through the feature.' },
  greater: { group:'bonus', emblem:'III', badge:'12 FREE SPINS', stat:'12 free spins', tier:'Start at ×32', text:'Begin with 12 free spins at altar ×32. Altar progression and banked Offerings persist through the feature.' },
  god: { group:'bonus', emblem:'IV', badge:'1 RITUAL SPIN', stat:'Pre-spin intervention', tier:'×250–×2500 altar', text:'One spin after a guaranteed intervention to altar ×250, ×500, ×1000 or ×2500. A win is not guaranteed; this spin can pay zero.' },
};

export function createRiteSelector({modes,getMode,getBalance,bet,onSelect,onBetChange,formatMoney}) {
  const el=id=>document.getElementById(id), dialog=el('modeDialog'), confirmation=el('riteConfirmDialog');
  const format=formatMoney||(value=>value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:6}));
  let preview='lesser', group='bonus';
  const selectionBet=id=>{
    const allowed=[...bet.options].map(option=>Number(option.value)).filter(value=>value*1000000<=(modes[id].maxBet??Infinity));
    return allowed.includes(Number(bet.value))?Number(bet.value):allowed.at(-1);
  };
  el('riteBet').replaceChildren(...[...bet.options].map(option=>new Option(option.text,option.value)));
  function showDetail() {
    const spec=modes[preview], info=details[preview], value=selectionBet(preview), cost=spec.cost*value;
    el('applyRite').disabled=!!spec.disabled||!Number.isFinite(value);
    el('riteDetailTitle').textContent=spec.name;
    el('riteDetailText').textContent=info.text;
    el('riteTotal').textContent=`${format(cost)} credits${info.group==='chance'?' / spin':''}`;
    el('riteConfirmLabel').textContent=info.group==='bonus'?'CONFIRM BONUS RITE':'CONFIRM SPIN COST';
    el('riteConfirmArt').src=`/assets/rite-${preview}.webp`;
    el('riteConfirmStat').textContent=`${info.stat} · ${info.tier}`;
    el('riteConfirmBet').textContent=format(value);
    el('applyRite').textContent=info.group==='bonus'?'Confirm rite':'Activate chance';
    dialog.dataset.preview=preview;
    for(const card of el('modeCards').children){
      const selected=card.dataset.mode===getMode();
      card.classList.toggle('selected',selected);card.setAttribute('aria-pressed',String(selected));
      card.querySelector('.rite-card-state').textContent=selected?'Active':details[card.dataset.mode].group==='bonus'?'Select bonus':modes[card.dataset.mode].cost>2?'Activate…':'Activate';
    }
  }
  function render() {
    el('riteBet').replaceChildren(...[...bet.options].map(option=>new Option(option.text,option.value)));
    el('riteBet').value=bet.value;el('riteBalance').textContent=format(getBalance()??0);
    el('riteBetDown').disabled=bet.selectedIndex===0;
    el('riteBetUp').disabled=bet.selectedIndex===bet.options.length-1;
    el('modeCards').dataset.group=group;
    el('modeCards').setAttribute('aria-labelledby',group==='bonus'?'bonusTab':'chanceTab');
    for(const tab of dialog.querySelectorAll('[role=tab]')){
      const active=tab.dataset.group===group;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
    }
    el('modeCards').replaceChildren(...Object.entries(details).filter(([,info])=>info.group===group).map(([id,info])=>{
      const spec=modes[id], value=selectionBet(id), card=document.createElement('button');
      card.disabled=!!spec.disabled||!Number.isFinite(selectionBet(id));
      card.type='button';card.className='mode-card rite-card';card.dataset.mode=id;
      card.innerHTML=`<span class="rite-illustration" aria-hidden="true"><span class="rite-arch"></span><span class="rite-art-halo"></span><span class="rite-art-relic"></span><span class="rite-art-priest"></span><span class="rite-art-entity"></span><span class="rite-emblem">${info.emblem}</span></span><span class="rite-card-body"><span class="rite-badge">${info.badge}</span><h3>${spec.name}</h3><span class="rite-start">${info.tier}</span><strong class="rite-price">${format(spec.cost*value)}<small>credits${group==='chance'?' / spin':''}</small></strong><span class="rite-cost-factor">${spec.cost}× base bet</span><span class="rite-card-state"></span></span>`;
      const illustration=card.querySelector('.rite-illustration');
      if(info.group==='chance'){
        const note=document.createElement('span');note.className='rite-card-description';
        note.textContent=id==='base'?'Standard spin cost. Scatters can unlock a bonus.':'Higher scatter chance. Bonus entry is not guaranteed.';
        card.querySelector('.rite-cost-factor').after(note);
      }
      if(info.group==='bonus'||spec.cost>2)card.setAttribute('aria-haspopup','dialog');
      const scene=new Image();scene.className='rite-scene-image';scene.alt='';scene.decoding='async';
      scene.addEventListener('load',async()=>{
        try { await scene.decode();illustration.classList.add('has-scene'); }
        catch { scene.remove(); }
      });
      scene.addEventListener('error',()=>scene.remove());
      scene.src=`/assets/rite-${id}.webp`;illustration.prepend(scene);
      card.addEventListener('click',()=>{
        preview=id;showDetail();
        if(info.group==='bonus'||(spec.cost>2&&id!==getMode()))confirmation.showModal();
        else {onSelect(id);dialog.close();}
      });return card;
    }));
    showDetail();
  }
  function switchGroup(next) {group=next;preview=details[getMode()]?.group===group?getMode():group==='bonus'?'lesser':'base';render();}
  for(const tab of dialog.querySelectorAll('[role=tab]')){
    tab.addEventListener('click',()=>switchGroup(tab.dataset.group));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();switchGroup(event.key==='Home'?'bonus':event.key==='End'?'chance':group==='bonus'?'chance':'bonus');
      el(group==='bonus'?'bonusTab':'chanceTab').focus();
    });
  }
  el('riteBet').addEventListener('change',()=>{bet.value=el('riteBet').value;onBetChange();});
  for(const [id,step] of [['riteBetDown',-1],['riteBetUp',1]])el(id).addEventListener('click',()=>{
    bet.selectedIndex=Math.max(0,Math.min(bet.options.length-1,bet.selectedIndex+step));onBetChange();
  });
  el('applyRite').addEventListener('click',()=>{
    if(modes[preview].disabled||!Number.isFinite(selectionBet(preview)))return;
    if(!confirmation.open)return;
    const selected=preview;
    bet.value=String(selectionBet(selected));
    confirmation.close();onSelect(selected);dialog.close();
  });
  el('cancelRite').addEventListener('click',()=>confirmation.close());
  confirmation.addEventListener('close',()=>{
    if(dialog.open)el('modeCards').querySelector(`[data-mode="${preview}"]`)?.focus();
  });
  return {refresh:render,open(){group=details[getMode()]?.group==='bonus'?'bonus':group;preview=details[getMode()]?.group===group?getMode():group==='bonus'?'lesser':'base';render();dialog.showModal();}};
}
