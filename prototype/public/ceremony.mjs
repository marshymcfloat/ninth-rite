import {formatMoney as number} from './money.mjs';

export const WIN_TIERS = Object.freeze([
  { id:'big', minimum:10, title:'Big win', caption:'The chalice overflows', mode:'lesser', countDuration:1.6 },
  { id:'mega', minimum:25, title:'Mega win', caption:'A tide of crimson', mode:'blood', countDuration:2 },
  { id:'epic', minimum:50, title:'Epic win', caption:'Crowned by the Hollow Halo', mode:'greater', countDuration:2.4 },
  { id:'divine', minimum:100, title:'Divine win', caption:'The entity bestows its favor', mode:'god', countDuration:2.8 },
].map(tier => Object.freeze(tier)));

export function winTier(payout, baseBet) {
  if (!Number.isFinite(payout) || !Number.isFinite(baseBet) || baseBet <= 0) return null;
  // Match the play-credit ledger's four-decimal precision at tier boundaries.
  const returned = Math.round(payout * 10000), base = Math.round(baseBet * 10000);
  if (base <= 0) return null;
  return WIN_TIERS.findLast(tier => returned >= base * tier.minimum) || null;
}

export function roundCelebration(book, { featureMode, featureName, modeCost = 1, context, replay = false } = {}) {
  const detail = book.noWalletChange || replay ? 'Recorded result. Your balance has not changed.' : '';
  const shared = { context, value:book.payout, unit:'play credits', detail, button:'Continue' };
  const charged = book.cost > 0 ? book.cost : book.bet * (book.unitCost ?? modeCost);
  const purchasedBonus = featureMode && book.mode === featureMode;
  const tierAmount = purchasedBonus ? book.payout - charged : book.payout;
  const tier = winTier(tierAmount, book.bet);
  if (featureMode) {
    const result = { ...shared, mode:featureMode, eyebrow:'RITUAL COMPLETE', caption:featureName, auto:false };
    if (tier) return { ...result, kind:'great-win', winTier:tier.id, title:tier.title, countDuration:tier.countDuration };
    const positive = book.payout > charged;
    return { ...result, kind:positive ? 'win' : 'return',
      title:positive ? 'You won' : book.payout > 0 ? 'Round return' : 'The rite is complete' };
  }
  if (!tier) return null;
  return { ...shared, ...tier, winTier:tier.id, kind:'great-win', auto:true,
    eyebrow:`${number(book.payout / book.bet)}× BASE BET`, detail:[`${tier.caption}.`, detail].filter(Boolean).join(' '),
    caption:'Total round return' };
}

export function createCeremony({ options, sound, skip }) {
  const $ = id => document.getElementById(id), dialog = $('ceremony');
  const gsap = globalThis.gsap;
  let active = null;
  const accents = new Set();
  const motion = () => gsap && !options().reduced && !options().skip && !document.hidden;
  const rate = () => options().fast ? 2.5 : 1;

  function finish() {
    if (!active) return;
    const item = active; active = null;
    item.intro?.kill(); item.outro?.kill(); clearTimeout(item.timer);
    dialog.close(); document.body.classList.remove('ceremony-open');
    dialog.dataset.phase = 'closed';
    item.resolve();
  }
  function completeReveal() {
    if (!active || dialog.dataset.phase === 'closing') return;
    active.intro?.progress(1);
    $('ceremonyValue').textContent = active.finalValue;
    dialog.dataset.phase = 'ready';
    $('ceremonyContinue').textContent = active.button;
  }
  function advance() {
    if (!active || dialog.dataset.phase === 'closing') return;
    if (dialog.dataset.phase === 'entering') { completeReveal(); return; }
    clearTimeout(active.timer);
    dialog.dataset.phase = 'closing';
    if (!motion()) { finish(); return; }
    active.outro = gsap.timeline({ onComplete:finish });
    active.outro.to('.ceremony-content', { y:-14, opacity:0, duration:.28 }, 0)
      .to('.ceremony-ring', { scale:1.12, opacity:0, duration:.44 }, 0)
      .to(dialog, { opacity:0, duration:.4 }, .05).timeScale(rate());
  }
  $('ceremonyContinue').addEventListener('click', advance);
  $('ceremonySkip').addEventListener('click', skip);
  dialog.addEventListener('cancel', event => { event.preventDefault(); advance(); });
  dialog.addEventListener('keydown', event => {
    if (event.repeat && ['Space','Enter'].includes(event.code)) event.preventDefault();
    if (['Space','Enter'].includes(event.code) && event.target === dialog) { event.preventDefault(); if (!event.repeat) advance(); }
  });
  dialog.addEventListener('close', () => { if (active && !dialog.open) finish(); });

  function show(spec) {
    finish();
    if (options().skip || document.hidden) return Promise.resolve();
    return new Promise(resolve => {
      const finalValue = spec.unit === 'play credits' ? number(spec.value) : String(spec.value);
      const button = spec.button || 'Continue';
      active = { resolve, finalValue, button, spec };
      dialog.dataset.kind = spec.kind; dialog.dataset.phase = 'entering';
      dialog.dataset.winTier = spec.winTier || '';
      $('ceremonyContext').textContent = spec.context || 'THE NINTH RITE';
      $('ceremonyEyebrow').textContent = spec.eyebrow;
      $('ceremonyTitle').textContent = spec.title;
      $('ceremonyValue').textContent = finalValue;
      $('ceremonyUnit').textContent = spec.unit;
      $('ceremonyCaption').textContent = spec.caption || '';
      $('ceremonyDetail').textContent = spec.detail || '';
      $('ceremonyContinue').textContent = 'Reveal now';
      const art = $('ceremonyArt');
      art.style.backgroundImage = `url('/assets/rite-${spec.mode || 'greater'}.webp')`;
      document.body.classList.add('ceremony-open');
      dialog.showModal(); $('ceremonyContinue').focus({preventScroll:true});
      const ready = () => {
        if (!active) return;
        dialog.dataset.phase = 'ready'; $('ceremonyValue').textContent = finalValue;
        $('ceremonyContinue').textContent = button;
        if (spec.auto) active.timer = setTimeout(advance, options().fast ? 900 : 2200);
      };
      if (!motion()) {
        if (gsap) {
          gsap.set([dialog,...dialog.querySelectorAll('[data-reveal],.ceremony-content,.ceremony-ring,.ceremony-gate')],{clearProps:'all'});
          gsap.set(art,{clearProps:'transform,opacity'});
        }
        ready(); return;
      }
      if(spec.kind!=='return') sound(spec.kind === 'entry' ? 'invoke' : 'bell');
      const counter = {value:0};
      const intro = gsap.timeline({paused:true,onComplete:ready,defaults:{ease:'power2.out'}});
      active.intro = intro;
      gsap.set('.ceremony-content',{opacity:1,y:0});
      gsap.set(art,{clearProps:'transform,opacity'});
      intro.fromTo(dialog,{opacity:0},{opacity:1,duration:.35},0)
        .fromTo('.ceremony-ring',{scale:.83,opacity:0,rotation:-16},{scale:1,opacity:.8,rotation:0,duration:1.15,ease:'power2.inOut'},.05)
        .fromTo('.ceremony-gate.left',{xPercent:0,opacity:1},{xPercent:-102,opacity:0,duration:1.1,ease:'power2.inOut'},.15)
        .fromTo('.ceremony-gate.right',{xPercent:0,opacity:1},{xPercent:102,opacity:0,duration:1.1,ease:'power2.inOut'},.15)
        .fromTo('[data-reveal]',{y:20,opacity:0},{y:0,opacity:1,duration:.65,stagger:.11},.35);
      if (spec.winTier) intro.fromTo(art,{scale:.92,opacity:0},{scale:1,opacity:1,duration:1.4,ease:'power2.out'},.15);
      if (spec.unit === 'play credits' && spec.value > 0) {
        intro.to(counter,{value:spec.value,duration:spec.countDuration ?? (spec.kind==='great-win'?2.6:1.35),ease:'power2.out',onUpdate:()=>{
          $('ceremonyValue').textContent=number(Math.floor(counter.value*100)/100);
        }},.65);
      }
      intro.timeScale(rate()).play();
    });
  }

  function pulse(target, amount = 1) {
    if (!motion() || !target) return;
    for(const tween of gsap.getTweensOf(target))accents.delete(tween);
    gsap.killTweensOf(target);
    const tween=gsap.fromTo(target,{opacity:.55,y:3*amount},{opacity:1,y:0,duration:.45,ease:'power2.out',clearProps:'opacity,transform',onComplete:()=>accents.delete(tween)});
    accents.add(tween);
  }
  function cascade(value) {
    const toast=$('cascadeAward');
    if (!motion()) { toast.hidden=true; return; }
    for(const tween of gsap.getTweensOf(toast))accents.delete(tween);
    gsap.killTweensOf(toast); toast.hidden=false;
    toast.textContent=`+${number(value)}`;
    const tween=gsap.fromTo(toast,{opacity:0,y:12},{opacity:1,y:0,duration:.22,onComplete:()=>{
      accents.delete(tween);
      const fade=gsap.to(toast,{opacity:0,y:-14,duration:.45,delay:.6,onComplete:()=>{toast.hidden=true;accents.delete(fade);}});accents.add(fade);
    }}); accents.add(tween);
    pulse($('win'));
  }
  function settingsChanged() {
    if (!motion()) {
      for(const tween of [...accents]) {tween.progress(1,true);tween.kill();} accents.clear();
      $('cascadeAward').hidden=true;
      if (options().skip || document.hidden) finish(); else completeReveal();
    } else active?.intro?.timeScale(rate());
  }
  function dismissCascade() {
    const toast = $('cascadeAward');
    if (gsap) {
      for (const tween of gsap.getTweensOf(toast)) accents.delete(tween);
      gsap.killTweensOf(toast);
    }
    toast.hidden = true;
  }
  return {show,finish,settingsChanged,pulse,cascade,dismissCascade,destroy(){finish();for(const tween of accents)tween.kill();accents.clear();}};
}
