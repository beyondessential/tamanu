import { enumTranslations } from '@tamanu/constants/enumRegistry';

// TODO: use tsnode so don't have to build before running and dont need extra script
console.log(enumTranslations.reduce((acc, [key, value]) => `"${key}","${value}"\n${acc}`, ''));
