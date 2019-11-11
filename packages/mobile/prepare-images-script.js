const fs = require('fs');
const files = fs.readdirSync('./assets/Icons').filter(x => x.includes('svg'));
const imports = files
  .map(x => `import ${x.split('.png')[0].replace('.svg', '')} from './${x}' `)
  .join('\n');
const ex =
  '{\n' +
  files
    .map(x => `"${x.split('.png')[0].replace('.svg', '')}": require("./${x}"),`)
    .join('\n') +
  '}';
const res = imports + 'export default ' + ex;
fs.writeFileSync('./indexImages.js', res);
