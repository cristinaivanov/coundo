const SHOWN_FOR_MS = 1700;
const FADE_MS = 300;

export function runSplash(ready) {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const skipped = new Promise(resolve => splash.addEventListener('click', resolve, { once: true }));
  const seen = new Promise(resolve => setTimeout(resolve, Math.max(0, SHOWN_FOR_MS - performance.now())));
  Promise.all([ready, Promise.race([skipped, seen])]).then(() => {
    splash.classList.add('leaving');
    setTimeout(() => splash.remove(), FADE_MS);
  });
}
