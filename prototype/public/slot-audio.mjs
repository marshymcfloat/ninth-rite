const cues = {
  tap: [{ frequency: 370, end: 240, length: .075, volume: .14 }],
  spin: [{ frequency: 280, end: 120, length: .16, volume: .22 }],
  win: [
    { frequency: 293.66, length: .16, volume: .12 },
    { frequency: 440, delay: .065, length: .2, volume: .13 },
    { frequency: 587.33, delay: .13, length: .24, volume: .11 },
  ],
  bonus: [
    { frequency: 220, length: .26, volume: .18 },
    { frequency: 329.63, delay: .1, length: .29, volume: .12 },
    { frequency: 523.25, delay: .22, length: .32, volume: .11 },
  ],
};

export function createSlotAudio(document, { musicSrc } = {}) {
  const win = document.defaultView;
  const lifetime = new win.AbortController();
  const AudioContext = win.AudioContext || win.webkitAudioContext;
  let soundEnabled = true, musicEnabled = false, unlocked = false;
  let context, output, music, playing;
  const canPlay = () => unlocked || win.navigator.userActivation?.hasBeenActive;

  function syncMusic() {
    if (!musicEnabled || document.hidden) {
      if (music && !music.paused) music.pause();
      return;
    }
    if (!musicSrc || !canPlay()) return;
    if (!music) {
      music = document.createElement('audio');
      music.dataset.slotMusic = '';
      music.hidden = true;
      music.loop = true;
      music.volume = .36;
      music.preload = 'none';
      music.src = musicSrc;
      document.body.append(music);
    }
    if (music.paused && !playing) {
      playing = Promise.resolve(music.play()).catch(() => {}).finally(() => { playing = null; });
    }
  }

  function syncVisibility() {
    syncMusic();
    if (document.hidden) context?.suspend().catch(() => {});
    else if (soundEnabled && canPlay()) context?.resume().catch(() => {});
  }

  function unlock(event) {
    if (!event.isTrusted) return;
    unlocked = true;
    syncVisibility();
  }

  for (const type of ['click', 'keydown']) document.addEventListener(type, unlock, { signal: lifetime.signal });
  document.addEventListener('visibilitychange', syncVisibility, { signal: lifetime.signal });

  function play(name) {
    const notes = cues[name];
    if (!notes || !AudioContext || !soundEnabled || document.hidden || !canPlay()) return;
    try {
      if (!context) {
        context = new AudioContext();
        output = context.createGain();
        output.gain.value = .42;
        output.connect(context.destination);
      }
      if (context.state === 'suspended') context.resume().catch(() => {});
      for (const { frequency, end, delay = 0, length, volume } of notes) {
        const start = context.currentTime + delay;
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = frequency < 380 ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        if (end) oscillator.frequency.exponentialRampToValueAtTime(end, start + length);
        envelope.gain.setValueAtTime(.001, start);
        envelope.gain.exponentialRampToValueAtTime(volume, start + .01);
        envelope.gain.exponentialRampToValueAtTime(.001, start + length);
        oscillator.connect(envelope);
        envelope.connect(output);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
        oscillator.start(start);
        oscillator.stop(start + length);
      }
    } catch { /* Sound is optional when the audio renderer is unavailable. */ }
  }

  return {
    play,
    setSound(enabled) {
      soundEnabled = enabled;
      if (output) output.gain.setTargetAtTime(enabled ? .42 : 0, context.currentTime, .015);
    },
    setMusic(enabled) { musicEnabled = enabled; syncMusic(); },
    destroy() {
      lifetime.abort();
      if (music) { music.pause(); music.remove(); }
      context?.close().catch(() => {});
    },
  };
}
