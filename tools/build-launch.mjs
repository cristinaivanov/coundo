// Usage: node tools/build-launch.mjs <playwright module path> - with the local server running, remakes the iPhone launch pictures.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const { default: playwright } = await import(pathToFileURL(process.argv[2]));
const root = new URL('../', import.meta.url);
const SCREENS = [
  [375, 667, 2], [375, 812, 3], [390, 844, 3], [393, 852, 3], [402, 874, 3], [414, 736, 3], [414, 896, 2],
  [414, 896, 3], [420, 912, 3], [428, 926, 3], [430, 932, 3], [440, 956, 3],
];

const page = fs.readFileSync(new URL('index.html', root), 'utf8');
const browser = await playwright.webkit.launch();
fs.rmSync(new URL('launch/', root), { recursive: true, force: true });
fs.mkdirSync(new URL('launch/', root));
const links = [];
for (const [width, height, ratio] of SCREENS) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: ratio, colorScheme: theme, reducedMotion: 'reduce', javaScriptEnabled: true });
    const tab = await context.newPage();
    await tab.route('**/js/app.js', route => route.fulfill({ contentType: 'text/javascript', body: '' }));
    await tab.goto('http://localhost:8080/');
    await tab.waitForTimeout(150);
    const name = `launch/${width}x${height}@${ratio}-${theme}.png`;
    await tab.screenshot({ path: new URL(name, root).pathname });
    await context.close();
    links.push(`  <link rel="apple-touch-startup-image" media="screen and (device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait) and (prefers-color-scheme: ${theme})" href="./${name}">`);
  }
}
await browser.close();
fs.writeFileSync(new URL('index.html', root), page.replace(/<!--launch-->[\s\S]*?<!--\/launch-->/, `<!--launch-->\n${links.join('\n')}\n  <!--/launch-->`));
console.log(links.length, 'launch pictures');
