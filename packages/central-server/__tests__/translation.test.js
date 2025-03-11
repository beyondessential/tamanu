import { sortBy } from 'lodash';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from './utilities';

const LANGUAGE_CODES = {
  ENGLISH: 'en',
  KHMER: 'km',
};

const LANGUAGE_NAMES = {
  [LANGUAGE_CODES.ENGLISH]: '🇬🇧 English',
  [LANGUAGE_CODES.KHMER]: '🇰🇭 ភាសាខ្មែរ',
};

describe('translations', () => {
  let ctx;
  let baseApp;
  let models;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    app = await baseApp.asRole('practitioner');
  });

  afterAll(async () => ctx.close());

  it('Should receive an object containing languageNames and languageCodes to be mapped onto options for select field', async () => {
    const { TranslatedString } = models;

    await TranslatedString.create({
      ...fake(TranslatedString),
      stringId: 'languageName',
      text: LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH],
      language: LANGUAGE_CODES.ENGLISH,
    });
    await TranslatedString.create({
      ...fake(TranslatedString),
      stringId: 'languageName',
      text: LANGUAGE_NAMES[LANGUAGE_CODES.KHMER],
      language: LANGUAGE_CODES.KHMER,
    });

    const result = await app.get('/v1/public/translation/languageOptions');
    expect(result).toHaveSucceeded();

    expect(result.body).toHaveProperty('languageNames');
    expect(result.body.languageNames).toHaveLength(2);
    expect(result.body.languageNames.map(({ text }) => text).sort()).toEqual([
      LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH],
      LANGUAGE_NAMES[LANGUAGE_CODES.KHMER],
    ]);

    expect(result.body).toHaveProperty('languagesInDb');
    expect(sortBy(result.body.languagesInDb, ['language'])).toEqual([
      { language: LANGUAGE_CODES.ENGLISH },
      { language: LANGUAGE_CODES.KHMER },
    ]);
  });
});
