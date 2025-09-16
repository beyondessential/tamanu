import { enumTranslations } from '../src/enumRegistry.js';

console.log(
  JSON.stringify(
    enumTranslations.map(([key, value]) => {
      return { stringId: key, defaultText: value };
    }),
  ),
);
