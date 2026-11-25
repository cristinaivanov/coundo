// Usage: node tools/build-flags.mjs - records each flag's width/height ratio so its space is reserved before it loads.
import fs from 'node:fs';

const dir = new URL('../flags/', import.meta.url);
const ratios = {};
for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.svg')).sort()) {
  const tag = fs.readFileSync(new URL(file, dir), 'utf8').match(/<svg[^>]*>/)[0];
  const attribute = name => parseFloat(tag.match(new RegExp(`\\s${name}="([\\d.]+)(?:px)?"`))?.[1]);
  const box = tag.match(/viewBox="([^"]+)"/)?.[1].trim().split(/[\s,]+/).map(Number);
  const [width, height] = [attribute('width'), attribute('height')];
  const ratio = width && height ? width / height : box[2] / box[3];
  ratios[file.replace('.svg', '')] = Number(ratio.toFixed(4));
}
fs.writeFileSync(new URL('../data/flag-ratios.js', import.meta.url), `export const FLAG_RATIOS = ${JSON.stringify(ratios)};\n`);
console.log(Object.keys(ratios).length, 'flags, ratios', Math.min(...Object.values(ratios)), 'to', Math.max(...Object.values(ratios)));
