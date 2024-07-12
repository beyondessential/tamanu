import { enumTranslations } from '@tamanu/constants/enumRegistry';

console.log(enumTranslations.reduce((acc, [key, value]) => `"${key}","${value}"\n${acc}`, ''));
