export function tap() {
  if (navigator.vibrate) {
    navigator.vibrate(12);
    return;
  }
  // iOS Safari has no vibrate API, but toggling a switch checkbox plays the system haptic (iOS 18+).
  const label = document.createElement('label');
  label.ariaHidden = 'true';
  label.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  label.append(input);
  document.head.append(label);
  label.click();
  label.remove();
}

export function celebrate() {
  if (navigator.vibrate) {
    navigator.vibrate([14, 90, 14, 90, 24]);
    return;
  }
  [0, 110, 220].forEach(delay => setTimeout(tap, delay));
}
