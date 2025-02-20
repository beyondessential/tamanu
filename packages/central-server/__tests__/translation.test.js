import { fake } from '@tamanu/shared/test-helpers/fake';
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
    expect(result.body.languageNames[0].text).toEqual(LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH]);
    expect(result.body.languageNames[1].text).toEqual(LANGUAGE_NAMES[LANGUAGE_CODES.KHMER]);

    expect(result.body).toHaveProperty('languagesInDb');
    expect(result.body.languagesInDb).toEqual([
      { language: LANGUAGE_CODES.ENGLISH },
      { language: LANGUAGE_CODES.KHMER },
    ]);
  });
});
