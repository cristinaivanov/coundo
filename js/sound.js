let context = null;

function tone(frequency, delay, length, volume = 0.08) {
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + length);
}

const TUNES = {
  right: [[587, 0, 0.16], [880, 0.09, 0.24]],
  wrong: [[233, 0, 0.28]],
  finish: [[523, 0, 0.2], [659, 0.12, 0.2], [784, 0.24, 0.2], [1047, 0.36, 0.5]],
};

export function play(name, enabled) {
  if (!enabled) return;
  try {
    context ??= new (window.AudioContext ?? window.webkitAudioContext)();
    if (context.state !== 'running') context.resume();
    for (const [frequency, delay, length] of TUNES[name]) tone(frequency, delay, length);
  } catch {
    context = null;
  }
}
