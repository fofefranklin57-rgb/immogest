import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'fs';

const logo = readFileSync('logo_immogest.svg', 'utf-8');
const feature = readFileSync('feature_graphic.svg', 'utf-8');

const tasks = [
  // PWA icons
  { svg: logo,    w: 512,  h: 512,  out: 'icon-512.png' },
  { svg: logo,    w: 192,  h: 192,  out: 'icon-192.png' },
  // Play Store
  { svg: logo,    w: 512,  h: 512,  out: 'playstore/icon-512.png' },
  { svg: feature, w: 1024, h: 500,  out: 'playstore/feature_graphic.png' },
];

import { mkdirSync } from 'fs';
try { mkdirSync('playstore', { recursive: true }); } catch(e) {}

for (const { svg, w, out } of tasks) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: w } });
  const png = resvg.render().asPng();
  writeFileSync(out, png);
  console.log(`✓ ${out}`);
}
