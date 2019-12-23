/**
 * temporary fix for react-native-largelist bug describe here: https://github.com/bolan9999/react-native-largelist/issues/369
 * The problem is that react-native cannot find the TextInputState inside the library
 *  and this breaks running debug or release.
 */

const fs = require('fs');

try {
  console.log('React spring scroll view fix...');
  const rootDir = process.cwd();

  const file = `${rootDir}/node_modules/react-native-spring-scrollview/SpringScrollView.js`;
  const data = fs.readFileSync(file, 'utf8');
  const dataFix = 'react-native/Libraries/Components/TextInput/TextInputState';

  if (data.indexOf(dataFix) !== -1) {
    throw new Error('> Already fixed');
  }

  const result = data.replace(/react-native\/lib\/TextInputState/g, dataFix);
  fs.writeFileSync(file, result, 'utf8');
  console.log('> Done');
} catch (error) {
  console.error(error);
}
