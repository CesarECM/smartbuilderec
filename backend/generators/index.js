const { generarDoc } = require('./doc-builder');

let raw = '';
process.stdin.on('data', chunk => raw += chunk);
process.stdin.on('end', () => {
  const d = JSON.parse(raw);
  generarDoc(d);
});
