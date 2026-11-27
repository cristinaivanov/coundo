import { h } from './util.js';

const canVibrate = typeof navigator.vibrate === 'function';

export const ANSWER_BUZZ = 12;
export const FINISH_BUZZ = [14, 90, 14, 90, 24];

export function buzz(pattern) {
  if (canVibrate) navigator.vibrate(pattern);
}

// iOS has no vibrate API and, since iOS 26.5, only plays the switch haptic when the user's own tap flips the switch, so an invisible one sits over the button.
export function hapticOnTap(button, on = true) {
  if (canVibrate) return;
  const existing = button.querySelector(':scope > .haptic');
  if (!on) existing?.remove();
  if (!on || existing) return;
  const input = h('input', { type: 'checkbox', switch: true, tabindex: '-1', onClick: e => e.stopPropagation() });
  button.append(h('label', { class: 'haptic', 'aria-hidden': 'true' }, input));
}
