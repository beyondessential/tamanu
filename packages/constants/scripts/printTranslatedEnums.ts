import { enumTranslations } from '../src/enumRegistry.js';

console.log(enumTranslations.reduce((acc, [key, value]) => `"${key}","${value}"\n${acc}`, ''));
