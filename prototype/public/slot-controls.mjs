const speeds = [
  { rate: 1, label: 'Normal' },
  { rate: 2, label: 'Turbo' },
  { rate: 4, label: 'Super Turbo' },
];
const toggles = [
  { key: 'sound', id: 'soundButton', label: 'Sound effects', icon: '<path d="M4 9h4l5-4v14l-5-4H4zm12 0a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10"/>' },
  { key: 'music', id: 'musicButton', label: 'Music', icon: '<path d="M9 17V6l11-2v11M9 9l11-2"/><ellipse cx="6.5" cy="17.5" rx="2.5" ry="2"/><ellipse cx="17.5" cy="15.5" rx="2.5" ry="2"/>' },
  { key: 'motion', id: 'motionButton', label: 'Motion effects', icon: '<path d="M3 9h8m-6 6h6m4-9 6 6-6 6"/>' },
];
const mounted = new WeakMap();

export function createSlotControls(root, {
  storageKey, reduced, gsap = () => globalThis.gsap,
  onSpeed = () => {}, onSound = () => {}, onMusic = () => {}, onMotion = () => {},
  tempoCue = '/slot-tempo.gif',
} = {}) {
  mounted.get(root)?.destroy();
  const document = root.ownerDocument;
  const win = document.defaultView;
  const lifetime = new win.AbortController();
  const listen = (element, type, handler) => element.addEventListener(type, handler, { signal: lifetime.signal });
  const settingsButton = root.querySelector('[data-slot-settings]');
  const panel = root.querySelector('[data-slot-panel]');
  const speedButton = root.querySelector('[data-slot-speed]');
  const speedValue = root.querySelector('[data-slot-speed-value]');
  const spinIcon = root.querySelector('[data-slot-spin] svg');
  const preference = { speed: 1, sound: true, music: false, motion: true };

  if (storageKey) {
    try {
      const saved = JSON.parse(win.localStorage.getItem(storageKey));
      if (speeds.some(({ rate }) => rate === saved?.speed)) preference.speed = saved.speed;
      for (const { key } of toggles) {
        if (typeof saved?.[key] === 'boolean') preference[key] = saved[key];
      }
    } catch { /* Preferences are optional when storage is unavailable. */ }
  }

  const titleId = `${panel.id}-title`;
  panel.setAttribute('aria-labelledby', titleId);
  panel.innerHTML = `
    <div class="slot-controls__settings-header">
      <h2>Settings</h2>
      <button class="slot-controls__icon" type="button" aria-label="Close settings" data-slot-close><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
    </div>
    <fieldset>
      <legend>Playback speed</legend>
      <div class="slot-controls__rates">
        <span class="slot-controls__rate-indicator" aria-hidden="true"></span>
        ${speeds.map(({ rate, label }) => `
          <label class="slot-controls__rate">
            <input type="radio" value="${rate}">
            <span><strong>${label}</strong><small>${rate}×</small></span>
          </label>`).join('')}
      </div>
    </fieldset>
    ${toggles.map(({ key, id, label, icon }) => `
      <button class="slot-controls__toggle" id="${id}" data-slot-toggle="${key}" type="button" aria-pressed="false">
        <svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>
        ${label}<span class="slot-controls__switch" aria-hidden="true"></span>
      </button>`).join('')}
  `;
  panel.querySelector('h2').id = titleId;
  const indicator = panel.querySelector('.slot-controls__rate-indicator');
  const radios = [...panel.querySelectorAll('input')];
  radios.forEach(input => { input.name = `${panel.id}-speed`; });
  const toggleButtons = Object.fromEntries([...panel.querySelectorAll('[data-slot-toggle]')].map(button => [button.dataset.slotToggle, button]));
  const motionAllowed = () => preference.motion && !reduced?.matches;
  const canAnimate = () => motionAllowed() && !document.hidden;
  let cueImage, cueTimer;

  function save() {
    if (!storageKey) return;
    try { win.localStorage.setItem(storageKey, JSON.stringify(preference)); } catch { /* Storage is optional. */ }
  }

  function clearCue() {
    win.clearTimeout(cueTimer);
    cueImage?.remove();
    cueImage = null;
  }

  function showCue() {
    clearCue();
    if (!canAnimate() || !tempoCue) return;
    cueImage = document.createElement('img');
    cueImage.className = 'slot-controls__tempo-cue';
    cueImage.alt = '';
    cueImage.setAttribute('aria-hidden', 'true');
    cueImage.src = tempoCue;
    speedButton.append(cueImage);
    cueTimer = win.setTimeout(clearCue, 540);
  }

  function renderSpeed(animate = false) {
    const index = speeds.findIndex(({ rate }) => rate === preference.speed);
    const { rate, label } = speeds[index];
    const next = speeds[(index + 1) % speeds.length];
    root.dataset.speed = String(rate);
    speedValue.textContent = `${rate}×`;
    speedButton.setAttribute('aria-label', `Playback speed: ${label} (${rate}×). Switch to ${next.label}.`);
    speedButton.title = `${label} · ${rate}×`;
    radios[index].checked = true;
    const engine = gsap();
    if (engine && animate && canAnimate() && !panel.hidden) {
      engine.to(indicator, { xPercent: index * 100, duration: .22, ease: 'power2.out', overwrite: true });
    } else if (engine) {
      engine.killTweensOf(indicator);
      engine.set(indicator, { xPercent: index * 100 });
    } else indicator.style.transform = `translateX(${index * 100}%)`;
  }

  function changeSpeed(rate) {
    if (preference.speed === rate) return;
    preference.speed = rate;
    save();
    renderSpeed(true);
    showCue();
    onSpeed(rate);
  }

  function renderToggles() {
    for (const key of ['sound', 'music']) toggleButtons[key].setAttribute('aria-pressed', String(preference[key]));
    toggleButtons.motion.setAttribute('aria-pressed', String(motionAllowed()));
    toggleButtons.motion.disabled = Boolean(reduced?.matches);
    toggleButtons.motion.title = reduced?.matches ? 'Controlled by your system motion preference' : '';
  }

  function syncMotion() {
    renderToggles();
    if (!canAnimate()) {
      clearCue();
      const engine = gsap();
      engine?.killTweensOf([panel, spinIcon, indicator]);
      engine?.set([panel, spinIcon], { clearProps: 'opacity,transform' });
      renderSpeed();
    }
    onMotion(motionAllowed());
  }

  function closeSettings(restoreFocus = false) {
    if (panel.hidden) return;
    gsap()?.killTweensOf(panel);
    panel.style.removeProperty('opacity');
    panel.style.removeProperty('transform');
    panel.hidden = true;
    settingsButton.setAttribute('aria-expanded', 'false');
    root.removeAttribute('data-settings-open');
    if (restoreFocus) settingsButton.focus();
  }

  function openSettings() {
    panel.hidden = false;
    settingsButton.setAttribute('aria-expanded', 'true');
    root.setAttribute('data-settings-open', '');
    const engine = gsap();
    if (canAnimate() && engine) {
      engine.fromTo(panel, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .19, ease: 'power2.out', clearProps: 'opacity,transform' });
    }
    panel.querySelector('input:checked')?.focus({ preventScroll: true });
  }

  listen(settingsButton, 'click', () => panel.hidden ? openSettings() : closeSettings(true));
  listen(panel.querySelector('[data-slot-close]'), 'click', () => closeSettings(true));
  listen(speedButton, 'click', () => {
    const index = speeds.findIndex(({ rate }) => rate === preference.speed);
    changeSpeed(speeds[(index + 1) % speeds.length].rate);
  });
  listen(panel, 'change', event => {
    if (radios.includes(event.target)) changeSpeed(Number(event.target.value));
  });
  for (const [key, button] of Object.entries(toggleButtons)) listen(button, 'click', () => {
    preference[key] = !preference[key];
    save();
    if (key === 'motion') syncMotion();
    else {
      renderToggles();
      (key === 'sound' ? onSound : onMusic)(preference[key]);
    }
  });
  listen(document, 'pointerdown', event => {
    if (!panel.contains(event.target) && !settingsButton.contains(event.target)) closeSettings();
  });
  listen(document, 'keydown', event => {
    if (event.key === 'Escape' && !panel.hidden && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      closeSettings(true);
    }
  });
  if (reduced) listen(reduced, 'change', syncMotion);
  renderSpeed();
  syncMotion();
  onSound(preference.sound);
  onMusic(preference.music);
  onSpeed(preference.speed);

  const controls = {
    get settingsOpen() { return !panel.hidden; },
    closeSettings,
    spinFeedback() {
      if (!canAnimate()) return;
      gsap()?.fromTo(spinIcon, { rotation: 0, transformOrigin: '50% 50%' }, {
        rotation: 360, duration: .4 / Math.sqrt(preference.speed), ease: 'power3.out',
        overwrite: true, clearProps: 'transform,transformOrigin',
      });
    },
    destroy() {
      closeSettings();
      clearCue();
      gsap()?.killTweensOf([panel, spinIcon, indicator]);
      lifetime.abort();
      mounted.delete(root);
    },
  };
  mounted.set(root, controls);
  return controls;
}
