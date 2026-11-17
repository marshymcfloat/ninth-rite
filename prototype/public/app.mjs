import { createGameView } from './pixi-view.mjs';
import { symbolArt, purchaseEntryBoard, bookRules, bloodGeometry } from './view-math.mjs';
import { createRiteSelector } from './rite-selector.mjs';
import { createBonusCounter } from './bonus-counter.mjs';
import { createCeremony, roundCelebration } from './ceremony.mjs';
import { createStakeClient } from './stake-client.mjs';
import { installSocialText } from './social.mjs';
import {formatMoney as format,setDisplayCurrency} from './money.mjs';
import {createLocalSession} from './local-session.mjs';

const $ = id => document.getElementById(id);
let stakeClient=null;
const localGame=createLocalSession();
const symbolNames = { C1: 'Jack', C2: 'Queen', C3: 'King', C4: 'Ace', P1: 'Blood chalice', P2: 'Horned crown', P3: 'Bound eye', P4: 'Reliquary', S: 'Hollow Halo scatter' };
// Display order only; the server's recorded events determine progression and payouts.
const altarSteps = [1, 2, 4, 8, 16, 32, 64, 120, 250, 500, 1000, 2500];
const paths = {
  C1: '<path d="M25 26h14v25H25zM21 51h22M27 29h10M32 26v-5M32 20c-10-6 0-13 0-13s10 7 0 13Z"/><path d="M28 27v8m8-8v5"/>',
  C2: '<circle cx="25" cy="23" r="10"/><circle cx="25" cy="23" r="4"/><path d="m32 30 18 18m-7-7 5-5m-2 8 5-5M19 17l12 12"/>',
  C3: '<path d="m32 9-15 13v20l15 13 15-13V22ZM32 9v46M17 22l30 20M47 22 17 42M25 16l14 32"/>',
  C4: '<path d="M32 10v12m-9-7 9 7 9-7M23 22 16 44h32l-7-22M17 44l6 9h18l6-9M23 32h18M24 39h16"/><circle cx="32" cy="28" r="2"/>',
  P1: '<path d="M19 17h26v12c0 9-5 14-13 14s-13-5-13-14ZM32 43v10m-9 1h18M19 21h-6v7c0 5 4 7 9 7m23-14h6v7c0 5-4 7-9 7"/><path d="m28 26 4-6 4 6-4 6Z"/>',
  P2: '<path d="m12 24 8 10 12-19 12 19 8-10-6 26H18ZM18 44h28"/><circle cx="12" cy="21" r="2"/><circle cx="32" cy="12" r="2"/><circle cx="52" cy="21" r="2"/><path d="m29 38 3-4 3 4-3 4Z"/>',
  P3: '<path d="M7 32s10-15 25-15 25 15 25 15-10 15-25 15S7 32 7 32Z"/><circle cx="32" cy="32" r="10"/><path d="m25 25 14 14m-14 0 14-14M16 13l4 7m28-7-4 7M16 51l4-7m28 7-4-7"/><circle cx="32" cy="32" r="3"/>',
  P4: '<path d="M17 22 32 10l15 12v31H17ZM23 23v24h18V23l-9-7Z"/><path d="M32 22v19m-6-13h12M26 53v-6m12 6v-6"/><circle cx="32" cy="32" r="4"/>',
  S: '<path d="M18 21 9 5l3 25m34-9L55 5l-3 25M19 47l-8 13h42L45 47"/><circle cx="32" cy="31" r="19" stroke="#a88165"/><circle cx="32" cy="31" r="13" fill="#020203" stroke="#ba3143"/><path d="m18 49 14 11 14-11"/><text x="32" y="63" text-anchor="middle" fill="currentColor" stroke="none" font-size="7">SCATTER</text>',
};
let config, session, mode = 'base', lastBook, busy = false, skipRequested = false, currentFeature = false, soundEnabled = false, audio;
const playingSounds = new Set();
function silence() { for(const osc of playingSounds) { try { osc.stop(); } catch {} } playingSounds.clear(); }
let pending = JSON.parse(localStorage.getItem('ninth-pending') || 'null');
let logs = [], featureSpin = 0;
let view = null, riteSelector;
const bonusCounter=createBonusCounter({names:id=>config.modes[id]?.name||id,options:()=>({reduced:$('reduced').checked,skip:skipRequested})});
let rules = { bloodThreshold: 5, offeringThreshold: 3, interventionTiming: 'next-tumble' };

function configureRules(next) {
  rules = next;
  view?.setRules(rules);
  $('bloodMeter').setAttribute('aria-valuemax', String(rules.bloodThreshold));
  const orbit = document.querySelector('.charge-orbit');
  orbit.querySelectorAll('.blood-channel, .blood-gem').forEach(node => node.remove());
  const geometry = bloodGeometry(rules.bloodThreshold);
  const point = (angle, radius) => [120 + Math.cos(angle) * radius, 120 + Math.sin(angle) * radius];
  orbit.insertAdjacentHTML('beforeend', geometry.angles.map((angle, i) => {
    const start = point(angle - geometry.half, 104), end = point(angle + geometry.half, 104), gem = point(angle, 105);
    const d = `M${start.join(' ')}A104 104 0 0 1 ${end.join(' ')}`;
    return `<g class="blood-channel"><path class="channel-edge" d="${d}"/><path class="channel-bed" d="${d}"/><path class="blood-track-fill" data-charge="${i+1}" d="${d}"/></g><g class="blood-gem" data-charge="${i+1}" transform="translate(${gem.join(' ')})"><circle class="gem-socket" cy="2" r="15"/><path d="M0 -14C-3 -7 -10 0 -10 6C-10 20 10 20 10 6C10 0 3 -7 0 -14Z"/><ellipse class="gem-glint" cx="-3" cy="4" rx="1.5" ry="4"/></g>`;
  }).join(''));
  $('displayNote').textContent = `GDD v${rules.interventionTiming === 'immediate' ? '1.4 · Legacy replay' : rules.maxWin ? '1.7' : rules.lowTierMinimumSteps ? '1.6' : '1.5'} · ${view ? 'PixiJS' : 'Basic display'} · ${config?.catalog ? 'Fixed outcome catalog' : 'Candidate math'}`;
  $('interventionStatus').textContent = '';
  $('interventionStatus').dataset.status = '';
}
const artImages = {};
const artReady = { symbols: false, ranks: false, scatter: false, frame: false, cathedral: false, priest: false, seal: false };
const reducedMedia = matchMedia('(prefers-reduced-motion: reduce)');
$('reduced').checked = localStorage.getItem('ninth-reduced') === 'true' || reducedMedia.matches;
document.body.classList.toggle('reduce-motion', $('reduced').checked);
const ceremony = createCeremony({ options:()=>({reduced:$('reduced').checked,fast:$('fast').checked,skip:skipRequested}), sound:tone, skip:skipPlayback });
function skipPlayback() { if(config?.jurisdiction?.disabledSlamstop)return;skipRequested=true;silence();view?.finishActive();ceremony.finish();ceremony.settingsChanged(); }

async function api(path, payload) {
  if(stakeClient){
    if(path==='/api/play')return stakeClient.play(payload);
    if(path==='/api/config')path='./config.json';
    else throw Error('Local development actions are unavailable in a server session');
  }
  const options = payload === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
  const response = await fetch(path, options);
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error || 'Request failed.'), { status: response.status });
  return data;
}

const announce = text => { $('announcement').textContent = text; };
const delay = milliseconds => view ? view.wait(milliseconds) : skipRequested || document.hidden ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, $('reduced').checked ? Math.min(milliseconds, 30) : $('fast').checked ? milliseconds / 4 : milliseconds));
function readablePause(milliseconds) {
  if(skipRequested||document.hidden)return Promise.resolve();
  return new Promise(resolve=>{
    const until=performance.now()+($('fast').checked?Math.max(750,milliseconds/2):milliseconds);
    const timer=setInterval(()=>{if(skipRequested||document.hidden||performance.now()>=until){clearInterval(timer);resolve();}},25);
  });
}
function setBusy(value) {
  busy = value;
  document.body.classList.toggle('is-playing', value);
  for (const id of ['spin', 'chooseMode', 'bet', 'betUp', 'betDown', 'demonstrate', 'scenario', 'newSession', 'menu']) $(id).disabled = value;
  $('replay').disabled = value || !lastBook;
  $('download').disabled = value || !lastBook;
  $('skip').disabled = !value;
  $('spin').querySelector('span').textContent = value ? 'Resolving round' : pending ? 'Retry round' : 'Spin';
  $('spin').querySelector('small').textContent = value ? 'WAIT' : pending ? 'RETRY' : 'SPIN';
}

async function loadArt() {
  if (!config.art) return;
  await Promise.all(Object.keys(artReady).map(async kind => {
    const asset = config.art[kind];
    if (!asset?.src || !/^(?:\.\/|\/)?assets\//.test(asset.src)) return;
    const image = new Image();
    image.src = asset.src;
    try {
      await image.decode();
      if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) return;
      artReady[kind] = true;
      artImages[kind] = image;
      document.body.classList.add(`art-${kind}`);
      document.body.style.setProperty(`--${kind}-image`, `url("${asset.src}")`);
    } catch { /* Keep the working vector placeholder if a draft image is unavailable. */ }
  }));
  if (artReady.frame) drawFrame();
}

function drawFrame() {
  const { src, width, height, opening, crop } = config.art.frame;
  if(config.art.frame.layout==='crimson') {
    const pieces = [
      [330,246,1400,70,0,-22,625,22], [330,1246,1400,140,0,505,625,32],
      [35,315,295,930,-38,0,38,505], [1730,315,295,930,625,0,38,505],
      [0,0,330,315,-38,-42,38,42], [1730,0,318,315,625,-42,38,42],
      [0,1245,330,291,-38,505,38,32], [1730,1245,318,291,625,505,38,32],
      [840,0,370,282,278,-48,69,48],
      [660,985,245,280,-55,465,50,65], [1360,985,245,280,630,465,50,65],
    ];
    $('generatedFrame').setAttribute('viewBox','-55 -48 735 585');
    $('generatedFrame').innerHTML=pieces.map(([sx,sy,sw,sh,x,y,w,h])=>`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${sx} ${sy} ${sw} ${sh}" preserveAspectRatio="none"><image href="${src}" width="${width}" height="${height}"/></svg>`).join('');
    document.body.classList.add('crimson-frame');
    return;
  }
  const xs = [crop.x, opening.x, 640, 1200, opening.x + opening.width, crop.x + crop.width];
  const ys = [crop.y, opening.y, opening.y + opening.height, crop.y + crop.height];
  const dx = [-35, 0, 257.5, 367.5, 625, 660], dy = [-43, 0, 505, 537];
  let pieces = '';
  for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
    if (row === 1 && col > 0 && col < 4) continue;
    const sw = xs[col+1]-xs[col], sh = ys[row+1]-ys[row];
    const dw = dx[col+1]-dx[col], dh = dy[row+1]-dy[row];
    if (row === 1 || col === 1 || col === 3) {
      const tw = row === 1 ? dw : sw * dh / sh, th = row === 1 ? sh * dw / sw : dh;
      const id = `frameTile${row}${col}`;
      pieces += `<defs><pattern id="${id}" patternUnits="userSpaceOnUse" x="${dx[col]}" y="${dy[row]}" width="${tw}" height="${th}"><svg width="${tw}" height="${th}" viewBox="${xs[col]} ${ys[row]} ${sw} ${sh}" preserveAspectRatio="none"><image href="${src}" width="${width}" height="${height}"/></svg></pattern></defs><rect x="${dx[col]}" y="${dy[row]}" width="${dw}" height="${dh}" fill="url(#${id})"/>`;
    } else pieces += `<svg x="${dx[col]}" y="${dy[row]}" width="${dw}" height="${dh}" viewBox="${xs[col]} ${ys[row]} ${sw} ${sh}" preserveAspectRatio="none"><image href="${src}" width="${width}" height="${height}"/></svg>`;
  }
  // Reposition the generated candles into the lower rim, clear of the symbols.
  for (const [x, sx] of [[0, 279], [570, 1560]]) pieces += `<svg x="${x}" y="505" width="55" height="37" viewBox="${sx} 1054 190 220" preserveAspectRatio="xMidYMax meet"><image filter="url(#frameMatte)" href="${src}" width="${width}" height="${height}"/></svg>`;
  $('generatedFrame').innerHTML = `<defs><filter id="frameMatte" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 10 10 10 0 -.10"/></filter></defs><g filter="url(#frameMatte)">${pieces}</g>`;
}

function symbolVisual(symbol) {
  const entry = symbolArt(config.art, symbol);
  if (entry && artReady[entry.kind]) {
    const { sheet, index, kind } = entry;
    const columns = sheet.columns || 1, rows = sheet.rows || 1;
    return `<span class="symbol-art" data-sheet="${kind}" style="background-image:var(--${kind}-image);background-size:${columns * 100}% ${rows * 100}%;background-position:${columns > 1 ? index % columns / (columns - 1) * 100 : 0}% ${rows > 1 ? Math.floor(index / columns) / (rows - 1) * 100 : 0}%"></span>${symbol === 'S' ? '<span class="scatter-caption">SCATTER</span>' : ''}`;
  }
  if (symbol.startsWith('C')) return `<svg viewBox="0 0 64 64"><text x="32" y="52" text-anchor="middle" fill="currentColor" font-family="Georgia,serif" font-weight="bold" font-size="58">${{C1:'J',C2:'Q',C3:'K',C4:'A'}[symbol]}</text></svg>`;
  return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${paths[symbol]}</svg>`;
}

function drawBoard(board, settings = {}) {
  $('board').classList.toggle('purchase-entry',Boolean(settings.purchase));
  $('board').classList.toggle('entity-entry',settings.purchase==='god');
  $('board').innerHTML = board.flat().map(c => `<div class="symbol entering ${c.symbol.startsWith('P') ? 'premium' : ''} ${c.symbol === 'S' ? 'scatter' : ''}" aria-hidden="true">${symbolVisual(c.symbol)}<span class="symbol-id">${c.symbol === 'S' ? '' : c.symbol}</span>${c.marked ? '<span class="offering-mark" title="Blood Offering">◆</span>' : ''}</div>`).join('');
  $('board').setAttribute('aria-label', `Six columns by five rows. ${board.flat().map(c => `${symbolNames[c.symbol]}${c.marked ? ', marked Offering' : ''}`).join('; ')}.`);
  return view?.reveal(board, settings) ?? Promise.resolve();
}

function ritualReadout(state, event = null) {
  if (!state) return;
  const index = altarSteps.indexOf(state.tier), sealed = Boolean(state.sealed);
  const blood = sealed ? 0 : Math.min(rules.bloodThreshold, state.blood);
  const offerings = !sealed && currentFeature ? state.offerings : 0;
  const ready = Math.floor(offerings / rules.offeringThreshold), extra = offerings % rules.offeringThreshold;
  const next = altarSteps[index + 1];
  $('altarStep').textContent = `STEP ${index + 1} OF ${altarSteps.length}`;
  $('bloodCount').textContent = sealed ? 'SEALED' : `${blood} / ${rules.bloodThreshold}`;
  $('offeringCount').textContent = sealed ? 'SEALED' : !currentFeature ? 'BONUS ONLY' : ready ? `${ready} READY` : `${offerings} / ${rules.offeringThreshold}`;
  $('nextAltarTitle').textContent = sealed ? 'SEALED' : 'NEXT STEP';
  $('nextAltar').textContent = next ? `×${next}` : 'MAX';
  $('bloodHint').textContent = sealed ? 'Final altar step reached' : `${rules.bloodThreshold - blood} winning ${rules.bloodThreshold - blood === 1 ? 'cluster' : 'clusters'} to the next step`;
  $('offeringHint').textContent = sealed ? 'Unused charges cleared' : !currentFeature ? 'Marked winners awaken the inner sigils' : ready ? `${ready} banked ${ready === 1 ? 'sigil' : 'sigils'}${extra ? ` · ${extra} extra` : ' · next eligible win'}` : `${rules.offeringThreshold - offerings} marked winning ${rules.offeringThreshold - offerings === 1 ? 'symbol' : 'symbols'} to invoke`;
  if(state.pendingTier)$('offeringHint').textContent=`3 Offerings spent · ×${state.pendingTier} awaits a winning tumble`;
  $('bloodMeter').setAttribute('aria-valuenow', String(blood));
  $('offeringMeter').setAttribute('aria-valuenow', String(Math.min(rules.offeringThreshold, offerings)));
  $('offeringMeter').setAttribute('aria-disabled', String(!currentFeature || sealed));
  $('offeringMeter').setAttribute('aria-valuetext', sealed ? 'Offerings sealed' : !currentFeature ? 'Offerings unlock inside bonus rites' : `${offerings} Offerings held. ${ready} sigils ready, ${extra} additional Offerings.`);
  $('haloScene').classList.toggle('sealed', sealed);
  $('haloScene').dataset.blood = String(blood);
  $('haloScene').dataset.offerings = String(offerings);
  for (const [selector, count] of [['.blood-gem, .blood-track-fill', blood], ['.offering-gem, .offering-track-fill', Math.min(rules.offeringThreshold, offerings)]]) {
    document.querySelectorAll(selector).forEach(node => node.classList.toggle('lit', Number(node.dataset.charge) <= count));
  }
  if (event) {
    const stepsEarned = altarSteps.indexOf(event.normalTier) - index;
    if (stepsEarned > 0) {
      $('nextAltarTitle').textContent = 'STEP UP';
      $('nextAltar').textContent = `×${event.normalTier}`;
      $('bloodHint').textContent = `${stepsEarned} altar ${stepsEarned === 1 ? 'step' : 'steps'} earned`;
    } else if (event.promotedTier) $('bloodHint').textContent = 'Sigil ready · the Halo intervenes';
  }
  $('bloodMeter').setAttribute('aria-valuetext', sealed ? 'Blood charges sealed at the maximum altar step' : `${blood} of ${rules.bloodThreshold} blood charges. ${$('bloodHint').textContent}.`);
}

function meters(state) {
  if (!state) return;
  document.body.classList.toggle('in-bonus', currentFeature);
  $('altar').textContent = `×${state.tier}`;
  $('altarState').textContent = state.sealed ? 'Both meters sealed' : currentFeature ? 'Persists through this feature' : 'Resets on the next paid round';
  ritualReadout(state);
  $('haloScene').classList.toggle('in-feature', currentFeature);
  view?.setState(state, currentFeature);
}

function showCollectedCharges(event) {
  ritualReadout({ ...event.before, blood: Math.min(rules.bloodThreshold, event.before.blood + event.bloodCollected), offerings: event.before.offerings + event.offeringsCollected }, event);
}

function addLog(title, detail = '') {
  logs.unshift({ title, detail });
  logs = logs.slice(0, 6);
  $('eventLog').replaceChildren(...logs.map(item => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = item.title;
    const small = document.createElement('small');
    small.textContent = item.detail;
    li.append(strong, small);
    return li;
  }));
}

function tone(intervention = false) {
  if (!soundEnabled || document.hidden || skipRequested) return;
  audio ??= new AudioContext();
  if (audio.state === 'suspended') audio.resume();
  const type = intervention === true ? 'invoke' : intervention || 'bell';
  const notes = type==='invoke' ? [55,82.41,110,164.81] : type==='land' ? [62,93] : type==='liquid' ? [123,185] : [220,329.63,554.37];
  const duration = type==='invoke' ? 1.5 : type==='land' ? .17 : type==='liquid' ? .42 : .85;
  for (const [i,frequency] of notes.entries()) {
    const osc=audio.createOscillator(),gain=audio.createGain();
    const start=audio.currentTime+i*.015;
    osc.type=type==='invoke'?'triangle':'sine';
    osc.frequency.setValueAtTime(frequency,start);
    if(type==='land'||type==='liquid')osc.frequency.exponentialRampToValueAtTime(frequency*.55,start+duration);
    gain.gain.setValueAtTime(.0001,start);
    gain.gain.exponentialRampToValueAtTime((type==='invoke'?.018:.027)/(i+1),start+.015);
    gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
    osc.connect(gain).connect(audio.destination);
    playingSounds.add(osc);
    osc.onended=()=>{playingSounds.delete(osc);osc.disconnect();gain.disconnect();};
    osc.start(start);osc.stop(start+duration+.02);
  }
}

async function invokeOverlay(tier, { pendingAward = false, confirmed = false } = {}) {
  ceremony.dismissCascade();
  $('invocation').querySelector('strong').textContent = `×${tier}`;
  $('invocation').querySelector('span').textContent = pendingAward ? 'THE ENTITY OFFERS' : confirmed ? 'INTERVENTION CONFIRMED' : 'THE HALO INTERVENES';
  $('invocation').querySelector('small').textContent=pendingAward?'PENDING · WIN THE NEXT TUMBLE':confirmed?'This winning tumble uses the confirmed multiplier':'Guaranteed altar · a win is not guaranteed';
  $('invocation').dataset.state=pendingAward?'pending':confirmed?'confirmed':'guaranteed';
  $('invocation').classList.add('visible');
  $('haloScene').classList.add('invoking');
  tone(true);
  await Promise.all([readablePause(pendingAward?2000:1600), view?.invocation({pending:pendingAward})]);
  $('invocation').classList.remove('visible');
  $('haloScene').classList.remove('invoking');
}

async function purchaseEntrance(book) {
  if (skipRequested || book.demonstration) return;
  const board=purchaseEntryBoard(book.mode,config.initialBoard);
  if(!board)return;
  const count=board.flat().filter(cell=>cell.symbol==='S').length;
  $('roundStatus').textContent='BONUS ENTRY';
  $('spinCounter').textContent=book.mode==='god'?'THE ENTITY ARRIVES':`${count} SCATTERS · ${config.modes[book.mode].name.toUpperCase()}`;
  $('board').dataset.presentation='purchase-entry';
  announce(book.mode==='god'?'God Mode purchased. The entity is summoned.':'Purchased rite: the required scatters are arriving.');
  try {
    await view?.purchaseExit();
    await drawBoard(board,{initial:true,animate:true,purchase:book.mode});
    tone('land');
    await delay(300);
    await view?.scatterSignal({singleEntity:book.mode==='god'});
    await delay(500);
    addLog('Purchased rite entrance',`${count} ${count===1?'entity scatter':'scatters'} · no payout or free spin consumed`);
  } finally {delete $('board').dataset.presentation;}
}

async function playBook(book, { replay = false, instant = false } = {}) {
  setBusy(true);
  configureRules(bookRules(book, config.rules));
  skipRequested = instant;
  view?.finishActive();
  lastBook = book;
  logs = [];
  featureSpin = 0;
  let featureMode = null;
  const context=book.noWalletChange?'SCRIPTED DEMONSTRATION · BALANCE UNCHANGED':replay?'REPLAY · BALANCE UNCHANGED':'THE NINTH RITE';
  $('eventLog').replaceChildren();
  $('win').textContent = '0.00';
  $('winLabel').textContent = book.noWalletChange ? 'DEMO WIN' : replay ? 'REPLAY WIN' : 'ROUND WIN';
  $('replayLabel').textContent = book.demonstration ? 'SCRIPTED DEMONSTRATION' : 'DETERMINISTIC PLAYBACK';
  if (!book.noWalletChange && !replay && !instant) $('balance').textContent = 'In play';
  try {
    for (const event of book.events) {
      bonusCounter.update(event);
      if (event.type === 'roundStart') {
        currentFeature = false;
        $('interventionStatus').textContent = '';
        $('interventionStatus').dataset.status = '';
        $('modeName').textContent = config.modes[book.mode].name.toUpperCase();
        $('paidAt').textContent = 'CLUSTER PAYS';
        $('winDetail').textContent = 'Shared edges connect. Diagonals do not.';
        meters(event.state);
        addLog(book.demonstrationName || config.modes[book.mode].name, book.noWalletChange ? 'Scripted example · balance unchanged' : `${replay ? 'Replay · ' : ''}Cost ${format(book.cost)} play credits`);
        await purchaseEntrance(book);
      } else if (event.type === 'godIntervention') {
        currentFeature = true;
        announce(`God Mode awards altar ×${event.tier}. A win is not guaranteed.`);
        addLog(`Pre-spin invocation · ×${event.tier}`, 'Guaranteed intervention, not a guaranteed payout');
        await invokeOverlay(event.tier);
        meters(event.state);
      } else if (event.type === 'featureStart') {
        currentFeature = true;
        featureMode = event.mode;
        featureSpin = 0;
        $('modeName').textContent = config.modes[event.mode].name.toUpperCase();
        announce(`${config.modes[event.mode].name}: ${event.spins} ${event.mode === 'god' ? 'initial spin' : 'free spins'} at altar ×${event.state.tier}.`);
        addLog(config.modes[event.mode].name, `${event.spins} spins · altar ×${event.state.tier}`);
        meters(event.state);
        await ceremony.show({kind:'entry',mode:event.mode,context,
          eyebrow:event.natural?'BONUS UNLOCKED':book.noWalletChange?'RITUAL PREVIEW':'THE RITE IS READY',
          title:config.modes[event.mode].name,value:event.spins,unit:event.mode==='god'?'ritual spin':'free spins',
          caption:`Begin at altar ×${event.state.tier}`,
          detail:event.mode==='god'?'The entity has intervened. A win is not guaranteed.':'The altar carries between spins. Three Offerings invoke the entity.',
          button:'Enter the rite'});
      } else if (event.type === 'spinStart') {
        currentFeature = event.feature;
        if (event.feature) featureSpin++;
        $('spinCounter').textContent = event.feature ? `SPIN ${featureSpin} · ${event.remaining} REMAIN` : '5+ CONNECTED TO WIN';
        $('roundStatus').textContent = event.feature ? config.modes[event.mode].name.toUpperCase() : 'BASE SPIN';
        meters(event.state);
        ceremony.pulse($('spinCounter'));
      } else if (event.type === 'retrigger') {
        $('spinCounter').textContent = `SPIN ${featureSpin} · ${event.remaining} REMAIN`;
        announce(`${event.scatterCount} scatters: +5 free spins. The one retrigger is now used.`);
        addLog('+5 free spins', `${event.scatterCount} initial-board scatters · one retrigger used`);
        await view?.scatterSignal();
        await ceremony.show({kind:'retrigger',mode:featureMode||'lesser',context,eyebrow:'THE RITE CONTINUES',title:'More free spins',value:`+${event.added}`,unit:'free spins',caption:`${event.remaining} spins remain`,detail:'Your altar and Offerings carry on. The one retrigger is now used.',button:'Continue the rite'});
      } else if (event.type === 'board') {
        $('roundStatus').textContent = event.initial ? 'INITIAL BOARD' : `CASCADE ${event.cascade}`;
        await drawBoard(event.board, { initial: event.initial, animate: true });
        tone('land');
        await delay(140);
      } else if (event.type === 'interventionPending') {
        meters(event.state);
        $('interventionStatus').dataset.status = 'pending';
        $('interventionStatus').textContent = `×${event.tier} pending · win the next tumble`;
        announce($('interventionStatus').textContent);
        addLog(`The Halo offers ×${event.tier}`, `Pending · earned altar ×${event.state.tier} · three Offerings spent`);
        await invokeOverlay(event.tier, { pendingAward: true });
      } else if (event.type === 'interventionConfirmed' || event.type === 'interventionExpired') {
        const confirmed = event.type === 'interventionConfirmed';
        meters(event.state);
        $('interventionStatus').dataset.status = confirmed ? 'confirmed' : 'expired';
        $('interventionStatus').textContent = confirmed ? `Last offer confirmed · ×${event.tier}` : `×${event.tier} offer expired · next tumble did not win`;
        announce($('interventionStatus').textContent);
        addLog(confirmed ? `×${event.tier} confirmed` : `×${event.tier} offer expired`, confirmed ? 'This winning tumble uses the new multiplier' : `Altar remains ×${event.state.tier} · Offerings stay spent`);
        await view?.interventionResult(confirmed);
        if (confirmed) { await invokeOverlay(event.tier, { confirmed: true }); await view?.tierUp(); }
        await delay(400);
      } else if (event.type === 'cascade') {
        const symbols = [...$('board').children];
        for (const cluster of event.clusters) for (const position of cluster.positions) symbols[position]?.classList.add('winning');
        for (const position of event.orphanPositions) symbols[position]?.classList.add('orphan');
        announce(`${event.clusters.length} winning ${event.clusters.length === 1 ? 'cluster' : 'clusters'}${event.orphanPositions.length ? `; ${event.orphanPositions.length} non-paying orphan cells clear` : ''}.`);
        await view?.highlight(event);
        tone('liquid');
        await view?.collect(event);
        if (event.promotedTier && rules.interventionTiming === 'immediate') {
          addLog(`The Halo intervenes · ×${event.promotedTier}`, `After normal tier ×${event.normalTier}; applies to this entire cascade`);
          await delay(250);
          await invokeOverlay(event.promotedTier);
        } else tone();
        meters(event.after);
        if (event.after.tier > event.before.tier && (!event.promotedTier || rules.interventionTiming !== 'immediate')) await view?.tierUp();
        $('paidAt').textContent = `THIS CASCADE PAID AT ×${event.payoutMultiplier}`;
        $('winDetail').textContent = `+${format(event.payoutHundredths / 100 * book.bet)} credits · ${event.clusters.length} ${event.clusters.length === 1 ? 'cluster' : 'clusters'}`;
        $('win').textContent = format(event.totalHundredths / 100 * book.bet);
        ceremony.cascade(event.payoutHundredths / 100 * book.bet);
        ceremony.pulse($('bloodCount'));
        if(event.offeringsCollected) ceremony.pulse($('offeringCount'));
        addLog(`+${format(event.payoutHundredths / 100 * book.bet)} credits`, `Paid at ×${event.payoutMultiplier} · altar now ×${event.after.tier}${event.after.sealed ? ' · meters sealed' : ''}`);
        await delay(440);
        for (const position of event.clearPositions) symbols[position]?.classList.add('clearing');
        if (view) await view.clear(event);
        else await delay(240);
      } else if (event.type === 'naturalBonus') {
        announce(`${config.modes[event.mode].name} unlocked. The base cascade chain is complete.`);
        addLog('Natural bonus awarded', config.modes[event.mode].name);
        await view?.scatterSignal();
      } else if (event.type === 'winCap') {
        announce('Maximum round return reached. The rite is complete.');
        addLog('Maximum win', `${format(book.bet*event.capHundredths/100)} · no further spins`);
      } else if (event.type === 'roundEnd') {
        meters(event.state);
        $('win').textContent = format(book.payout);
        $('spinCounter').textContent = `${event.spins} ${event.spins === 1 ? 'SPIN' : 'SPINS'} COMPLETE`;
        $('roundStatus').textContent = 'ROUND COMPLETE';
        announce(book.demonstration ? `${book.demonstrationDescription} Balance unchanged.` : replay ? 'Replay complete. Your balance has not changed.' : `Round complete. ${format(book.payout)} play credits awarded.`);
        addLog('Round complete', `${format(book.payout)} credits · ${event.interventionCount} ${event.interventionCount === 1 ? 'intervention' : 'interventions'}`);
        const celebration = roundCelebration(book, { featureMode, featureName:config.modes[featureMode]?.name,
          modeCost:config.modes[book.mode]?.cost ?? 1, context, replay });
        if (celebration) await ceremony.show(celebration);
      }
    }
  } finally {
    ceremony.finish();
    $('balance').textContent = format(session.balance);
    $('invocation').classList.remove('visible');
    setBusy(false);
    if(!instant) $('spin').focus({preventScroll:true});
  }
}

function updateMode() {
  const spec = config.modes[mode];
  if(stakeClient&&!stakeClient.replay){
    const previous=Number($('bet').value),amounts=config.allowedBets.filter(n=>n*1000000<=(spec.maxBet??Infinity));
    $('bet').replaceChildren(...amounts.map(n=>new Option(format(n),String(n))));
    $('bet').value=String(amounts.includes(previous)?previous:amounts.at(-1));
  }
  $('selectedMode').innerHTML = `${spec.name} <span>⌄</span>`;
  $('cost').textContent = `Cost ${format(Number($('bet').value) * spec.cost)} credits`;
  riteSelector?.refresh();
}

async function requestPlay() {
  if(stakeClient?.replay)return;
  if (busy || !session) return;
  if(!stakeClient){
    setBusy(true);
    try{
      await localGame.run(async()=>{
        const result=await localGame.play({mode,bet:Number($('bet').value)});
        pending=null;session=result;
        if(result.round)await playBook(result.round);
      });
    }catch(error){pending=localGame.pending();announce(`${error.message}${pending?' Retry to recover the previous request before placing another play.':''}`);}
    finally{setBusy(false);}
    return;
  }
  setBusy(true);
  try {
    pending ??= { sessionId: session.sessionId, mode, bet: Number($('bet').value), requestId: crypto.randomUUID() };
    localStorage.setItem('ninth-pending', JSON.stringify(pending));
    const result = await api('/api/play', pending);
    pending = null;
    localStorage.removeItem('ninth-pending');
    session = result;
    if(result.round)await playBook(result.round);
    else {announce(result.message||'Round recovered.');setBusy(false);}
    if(stakeClient){setBusy(true);session.balance=await stakeClient.complete();$('balance').textContent=format(session.balance);setBusy(false);}
  } catch (error) {
    if (error.status && error.status < 500) { pending = null; localStorage.removeItem('ninth-pending'); }
    announce(`${error.message}${pending ? ' Retry to recover the previous request before placing another play.' : ''}`);
    setBusy(false);
  }
}

$('spin').addEventListener('click', requestPlay);
$('bet').addEventListener('change', updateMode);
$('chooseMode').addEventListener('click', () => riteSelector.open());
$('menu').addEventListener('click', () => $('menuDialog').showModal());
$('history').addEventListener('click', () => openMenuPage('historyDialog'));
$('rules').addEventListener('click', () => openMenuPage('rulesDialog'));
$('settings').addEventListener('click', () => openMenuPage('settingsDialog'));
function openMenuPage(id) { $('menuDialog').close(); $(id).showModal(); }
for (const id of ['historyDialog', 'rulesDialog', 'settingsDialog']) {
  $(id).addEventListener('close', () => { if (!busy && !document.querySelector('dialog[open]')) $('menu').focus(); });
}
for (const [id, direction] of [['betUp', 1], ['betDown', -1]]) {
  $(id).addEventListener('click', () => {
    if (busy) return;
    const select = $('bet');
    select.selectedIndex = Math.max(0, Math.min(select.options.length - 1, select.selectedIndex + direction));
    updateMode();
  });
}
$('fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { announce('Fullscreen is unavailable in this browser.'); }
});
document.addEventListener('fullscreenchange', () => $('fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));
$('skip').addEventListener('click', skipPlayback);
$('fast').addEventListener('change', () => {view?.settingsChanged();ceremony.settingsChanged();});
$('replay').addEventListener('click', () => { if (lastBook && !busy) { $('menuDialog').close(); playBook(lastBook, { replay: true }); } });
$('reduced').addEventListener('change', () => { localStorage.setItem('ninth-reduced', $('reduced').checked); document.body.classList.toggle('reduce-motion', $('reduced').checked); view?.settingsChanged();ceremony.settingsChanged(); });
$('sound').addEventListener('click', () => { soundEnabled = !soundEnabled; $('sound').setAttribute('aria-pressed', String(soundEnabled)); $('sound').querySelector('span').textContent = soundEnabled ? 'Sound on' : 'Sound off'; $('sound').title = soundEnabled ? 'Sound on' : 'Sound off'; if (soundEnabled) tone(); else silence(); });
document.addEventListener('visibilitychange',()=>{document.body.classList.toggle('page-hidden',document.hidden);if(document.hidden)silence();ceremony.settingsChanged();});
$('newSession').addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  try {
    session = stakeClient?await api('/api/session', {}):await localGame.run(()=>localGame.reset());
    localStorage.setItem('ninth-session', session.sessionId);
    localStorage.removeItem('ninth-pending'); pending = null; lastBook = null;
    mode = 'base'; updateMode();
    $('balance').textContent = format(session.balance);
    $('win').textContent = '0.00';
    $('winLabel').textContent = 'ROUND WIN';
    $('modeName').textContent = 'STANDARD';
    $('roundStatus').textContent = '6 COLUMNS · 5 ROWS';
    $('spinCounter').textContent = '5+ CONNECTED TO WIN';
    $('paidAt').textContent = 'CLUSTER PAYS';
    $('winDetail').textContent = 'Shared edges connect. Diagonals do not.';
    $('replayLabel').textContent = 'DETERMINISTIC PLAYBACK';
    configureRules(config.rules);
    currentFeature = false; meters({ tier: 1, blood: 0, offerings: 0 }); await drawBoard(config.initialBoard);
    logs = []; $('eventLog').replaceChildren();
    $('sessionNotice').textContent = 'New sandbox ready. The previous round history was cleared.';
    announce('New sandbox. 10,000 play credits available.');
  } catch (error) { announce(error.message); } finally { setBusy(false); }
});
$('demonstrate').addEventListener('click', async () => {
  if (busy) return;
  setBusy(true);
  try {
    const result = await api('/api/scenario', { sessionId: session.sessionId, scenario: $('scenario').value });
    $('menuDialog').close();
    await playBook(result.round);
  } catch (error) { announce(error.message); setBusy(false); }
});
$('download').addEventListener('click', () => {
  if (!lastBook) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(lastBook, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = `ninth-rite-${lastBook.id}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
document.addEventListener('keydown', event => {
  if(config?.jurisdiction?.disabledSpacebar&&event.code==='Space')return;
  if(event.repeat && ['Space','Enter'].includes(event.code) && event.target.id==='spin') {event.preventDefault();return;}
  if (event.code === 'Space' && !event.repeat && !document.querySelector('dialog[open]') && !['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA', 'SUMMARY'].includes(event.target.tagName)) {
    event.preventDefault(); requestPlay();
  }
});
window.addEventListener('pagehide', event => { if (!event.persisted) {view?.destroy();ceremony.destroy();} });

async function init() {
  try {
    stakeClient=createStakeClient({search:location.search});
    config = await api('/api/config');
    if(stakeClient){session=await stakeClient.initialize(config);setDisplayCurrency(config.currency);pending=null;}
    if(config.catalog){
      config.assumptions=config.assumptions.filter(text=>!text.includes('disposable test values'));
      document.querySelector('.scene-footnote span:first-child').textContent='GDD v1.7 · Fixed outcome catalog';
      document.querySelector('.footnote span:last-child').textContent='Fixed outcome catalog · Theoretical RTP 96.50%';
      document.querySelector('#rulesDialog .notice').textContent='Theoretical RTP is calculated from fixed weighted outcomes. The complete round is capped at 50,000× base bet. These figures describe many plays, not a promised result for a session.';
      document.querySelector('meta[name="description"]').content='THE NINTH RITE — a gothic cluster game with an ascending altar and conditional interventions.';
      for(const heading of document.querySelectorAll('#rulesDialog h3')){
        if(heading.textContent==='Placeholder paytable')heading.textContent='Paytable';
        if(heading.textContent==='Working prototype assumptions')heading.textContent='Configuration notes';
      }
    }
    $('bet').replaceChildren(...config.allowedBets.map(value=>new Option(format(value),String(value))));
    $('bet').value=String(config.defaultBet??1);
    if($('bet').selectedIndex<0)$('bet').selectedIndex=0;
    if(stakeClient){
      for(const id of ['newSession','scenario','demonstrate','download'])$(id).hidden=true;
      document.querySelector('.demo-controls').hidden=true;
      const limits=config.jurisdiction||{};
      if(limits.disabledBuyFeature)for(const [key,spec] of Object.entries(config.modes))if(['lesser','blood','greater','god'].includes(key)){spec.disabled=true;spec.reason='Unavailable in this location';}
      if(limits.disabledSlamstop)$('skip').hidden=true;
      if(limits.displayNetPosition||limits.displaySessionTimer||limits.displayRTP){
        const status=document.createElement('div');status.className='session-information';status.setAttribute('aria-label','Session information');document.querySelector('.game-shell').append(status);
        const opened=performance.now(),startingBalance=session.balance;
        const refresh=()=>{status.textContent=[limits.displayNetPosition?`Session result ${format(session.balance-startingBalance)}`:'',limits.displaySessionTimer?`Session ${Math.floor((performance.now()-opened)/60000)}:${String(Math.floor((performance.now()-opened)/1000)%60).padStart(2,'0')}`:'',limits.displayRTP?`RTP ${config.catalog?.[mode]?(config.catalog[mode].rtp*100).toFixed(2)+'%':'not calibrated'}`:''].filter(Boolean).join(' · ');};
        refresh();const timer=setInterval(refresh,1000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
      }
      if(limits.disabledTurbo||limits.disabledSuperTurbo){$('fast').checked=false;$('fast').disabled=true;}
      if(limits.disabledFullscreen)$('fullscreen').hidden=true;
      if(stakeClient.params.get('social')==='true'||limits.socialCasino)installSocialText();
    }
    riteSelector = createRiteSelector({
      modes:config.modes, getMode:()=>mode, getBalance:()=>session?.balance,
      bet:$('bet'), onBetChange:updateMode,formatMoney:format,
      onSelect:id=>{
        mode=id; updateMode();
        const spec=config.modes[id];
        announce(`${spec.name} selected. Cost ${format(spec.cost * Number($('bet').value))} play credits.${id === 'god' ? ' An intervention is guaranteed; a win is not.' : ''}`);
      },
    });
    await loadArt();
    view = await createGameView({ stage: document.querySelector('.stage'), board: $('board'), ritual: $('haloScene'), surface: $('pixiSurface'), images: artImages, art: config.art, atlas: config.art?.symbols, seal: config.art?.seal, onCharge: showCollectedCharges, options: () => ({ reduced: $('reduced').checked, fast: $('fast').checked, skip: skipRequested }) });
    configureRules(config.rules);
    updateMode();
    await drawBoard(config.initialBoard);
    meters({ tier: 1, blood: 0, offerings: 0 });
    $('scenario').replaceChildren(...Object.entries(config.scenarios).map(([id, spec]) => new Option(spec.name, id)));
    const tbody = $('paytable').querySelector('tbody');
    for (const [index, symbol] of Object.keys(symbolNames).filter(id => id !== 'S').entries()) {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${symbol} · ${symbolNames[symbol]}</td>${config.testMath.bands.map(b => `<td>${(config.testMath.payHundredths[index] * b.factor / 100).toFixed(2)}×</td>`).join('')}`;
      tbody.append(row);
    }
    $('assumptions').replaceChildren(...config.assumptions.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    const statistics=document.createElement('section');statistics.id='releaseStatistics';
    const heading=document.createElement('h3');heading.textContent='Mode information';statistics.append(heading);
    for(const [key,spec] of Object.entries(config.modes).filter(([,s])=>!s.disabled)){
      const p=document.createElement('p'),rtp=config.catalog?.[key]?.rtp;
      p.textContent=`${spec.name}: ${spec.cost}× base bet. RTP ${rtp===undefined?'not calibrated':(rtp*100).toFixed(2)+'%'}. Maximum total return: ${config.rules.maxWin?.toLocaleString()||'not defined'}× base bet.`;statistics.append(p);
    }
    document.querySelector('#rulesDialog .rules-body').append(statistics);
    const controlsGuide=document.createElement('section');
    const controlsTitle=document.createElement('h3');controlsTitle.textContent='Controls';
    const controlsText=document.createElement('p');controlsText.textContent='Choose rite previews available modes and prices. Confirm the selection, then press Spin to start. The − and + controls change the base amount. The menu contains rules, round history and motion settings. Sound toggles audio.';
    controlsGuide.append(controlsTitle,controlsText);document.querySelector('#rulesDialog .rules-body').append(controlsGuide);
    if(stakeClient){
      $('balance').textContent=format(session.balance);lastBook=session.lastRound;
      if(stakeClient.replay){
        document.body.classList.add('public-replay');
        for(const id of ['spin','chooseMode','bet','betUp','betDown','balance','replay'])$(id).hidden=true;
        $('balance').parentElement.hidden=true;$('bet').closest('.bet-control')?.setAttribute('hidden','');
        const control=document.createElement('button');control.id='publicReplay';control.className='secondary-button';control.textContent='Play replay';
        const info=document.createElement('div');info.className='replay-info';info.textContent=`Base ${format(lastBook.bet)} · ${lastBook.cost/lastBook.bet}× · Cost ${format(lastBook.cost)}`;
        document.querySelector('.controls').append(info);$('fast').closest('label').hidden=true;
        document.querySelector('.controls').append(control);
        control.addEventListener('click',async()=>{control.disabled=true;try{await playBook(lastBook,{replay:true});}finally{control.disabled=false;control.textContent='Play again';}});
        announce(`Replay ready · ${config.modes[lastBook.mode].name} · Base amount ${format(lastBook.bet)} · Total cost ${format(lastBook.cost)}`);setBusy(false);return;
      }
      if(lastBook){$('bet').value=String(lastBook.bet);mode=lastBook.mode;updateMode();await playBook(lastBook,{replay:true,instant:true});session.balance=await stakeClient.complete();$('balance').textContent=format(session.balance);}
      else setBusy(false);
      return;
    }
    session=await localGame.run(()=>localGame.init());
    pending=localGame.pending();
    $('balance').textContent = format(session.balance);
    lastBook = session.lastRound;
    if (pending) { setBusy(false); await requestPlay(); }
    else if (lastBook) await playBook(lastBook, { replay: true, instant: true });
    else setBusy(false);
  } catch (error) { announce(`Could not start: ${error.message}. Reload to retry.`); }
}
init();
