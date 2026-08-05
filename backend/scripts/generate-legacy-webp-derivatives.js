const fs = require('fs');
const path = require('path');
const sharp = require('../node_modules/sharp');

const root = process.argv[2];
if (!root) throw new Error('usage: node generate-legacy-webp-derivatives.js UPLOADS_PRODUCTS');
const output = path.join(root, '_derivatives');
fs.mkdirSync(output, { recursive: true });

const originals = fs.readdirSync(root)
  .filter(name => /^legacy-.*\.(jpe?g|png|webp|gif)$/i.test(name));
const sizes = [
  ['thumb', 320],
  ['medium', 800],
  ['large', 1600],
  ['retina', 2400],
];
let cursor = 0;
let generated = 0;
let skipped = 0;
const failures = [];

async function processOriginal(name) {
  const source = path.join(root, name);
  const stem = name.replace(/\.[^.]+$/, '');
  for (const [label, edge] of sizes) {
    const target = path.join(output, `${stem}-${label}.webp`);
    if (fs.existsSync(target) && fs.statSync(target).size > 0) {
      skipped += 1;
      continue;
    }
    await sharp(source)
      .rotate()
      .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(target);
    generated += 1;
  }
}

async function worker() {
  while (cursor < originals.length) {
    const name = originals[cursor++];
    try { await processOriginal(name); }
    catch (error) { failures.push({ name, error: String(error.message || error) }); }
  }
}

Promise.all([worker(), worker(), worker()]).then(() => {
  console.log(JSON.stringify({ originals: originals.length, generated, skipped, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
});
