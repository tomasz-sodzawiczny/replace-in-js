const replace = require('./src');

replace(/t\(['"]TRANSLATEME_([^'"]*)['"]\)/g, (match, key) => `"${key}"`, {
  srcDir: 'example/dist/',
  file: 'main.js',
  mapFile: 'main.js.map',
  outDir: 'example/out/',
});
