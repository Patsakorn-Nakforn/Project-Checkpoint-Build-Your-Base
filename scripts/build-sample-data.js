const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const outFile = path.join(__dirname, '..', 'js', 'sample-data.js');

const portfolios = fs.readdirSync(dataDir)
  .filter(f => /^sample-portfolio-\d+\.json$/.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  .map(f => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')));

const out =
  '// สร้างอัตโนมัติจาก data/sample-portfolio-*.json ห้ามแก้มือ\n' +
  '// สร้างใหม่: node scripts/build-sample-data.js\n' +
  'window.SAMPLE_DATA = ' + JSON.stringify(portfolios, null, 2) + ';\n';

fs.writeFileSync(outFile, out);
console.log(`OK: ${portfolios.length} portfolios -> ${outFile}`);