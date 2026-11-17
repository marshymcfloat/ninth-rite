export function bonusCounterState(state, event) {
  if(event.type==='roundStart')return null;
  if(event.type==='featureStart')return {mode:event.mode,remaining:event.spins,phase:'entry',added:0};
  if(!state)return state;
  if(event.type==='spinStart'&&event.feature)return {...state,remaining:event.remaining,phase:'playing',added:0};
  if(event.type==='retrigger')return {...state,remaining:event.remaining,phase:'playing',added:event.added};
  if(event.type==='spinEnd'&&state.phase!=='cap')return {...state,remaining:event.remaining,phase:event.remaining?'between':'final',added:0};
  if(event.type==='winCap')return {...state,remaining:0,phase:'cap',added:0};
  if(event.type==='roundEnd')return {...state,remaining:0,phase:state.phase==='cap'?'cap':'complete',added:0};
  return state;
}

export function bonusCounterText(state) {
  if(!state)return null;
  const god=state.mode==='god',label=god?'RITUAL SPIN':'FREE SPINS';
  if(state.phase==='cap')return {label:'MAX WIN',value:'REACHED',unit:'RITE COMPLETE',hint:'No further spins',announcement:'Maximum win reached. No further spins.'};
  if(state.phase==='complete')return {label:'RITE',value:'COMPLETE',unit:'',hint:'All spins resolved',announcement:'Bonus complete. All spins resolved.'};
  if(god)return {label,value:'1',unit:state.phase==='entry'?'SPIN':'IN PLAY',hint:'One ritual spin',announcement:'One ritual spin. A win is not guaranteed.'};
  if(state.remaining===0)return {label,value:'FINAL',unit:'SPIN',hint:'Current spin in play',announcement:'Final free spin in play.'};
  return {label,value:String(state.remaining),unit:'LEFT',hint:state.phase==='playing'?'After this spin':state.phase==='entry'?'Ready to begin':'Ready for next spin',announcement:`${state.added?`${state.added} extra spins. `:''}${state.remaining} free spins ${state.phase==='playing'?'remain after the current spin':'remaining'}.`};
}

export function createBonusCounter({names,options}) {
  const el=id=>document.getElementById(id),panel=el('bonusSpinCounter');
  let state=null,animation;
  return {update(event){
    const next=bonusCounterState(state,event);
    if(next===state)return;
    state=next;
    animation?.cancel();
    panel.hidden=!state;
    document.querySelector('.game-shell').classList.toggle('has-bonus-counter',!!state);
    if(!state){el('bonusCounterAnnouncement').textContent='';return;}
    const text=bonusCounterText(state);
    panel.dataset.phase=state.phase;
    panel.dataset.words=String(text.value.length>2);
    el('bonusCounterLabel').textContent=text.label;
    el('bonusCounterValue').textContent=text.value;
    el('bonusCounterUnit').textContent=text.unit;
    el('bonusCounterHint').textContent=text.hint;
    el('bonusCounterAdded').textContent=state.added?`+${state.added} SPINS`:'';
    el('bonusCounterAdded').hidden=!state.added;
    el('bonusCounterName').textContent=names(state.mode);
    if(event.type!=='spinEnd')el('bonusCounterAnnouncement').textContent=text.announcement;
    if(!options().reduced&&!options().skip&&!document.hidden){
      animation=panel.animate(state.added?[
        {boxShadow:'0 0 0 transparent'},{boxShadow:'0 0 24px #efbd7199'},{boxShadow:'0 0 0 transparent'}
      ]:[{opacity:.55},{opacity:1}],{duration:state.added?650:220,easing:'ease-out'});
    }
  }};
}
