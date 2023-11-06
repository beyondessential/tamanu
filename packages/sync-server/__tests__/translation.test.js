import { fake } from 'shared/test-helpers/fake';
import Chance from 'chance';
import { createTestContext } from './utilities';

const chance = new Chance();

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

  it('Should receive a list of languages stored in the DB in the format of select options', async () => {
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

    const result = await app.get('/v1/translation/preLogin');
    expect(result).toHaveSucceeded();

    const expectedResult = [
      { label: LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH], value: LANGUAGE_CODES.ENGLISH },
      { label: LANGUAGE_NAMES[LANGUAGE_CODES.KHMER], value: LANGUAGE_CODES.KHMER },
    ];
    expect(result.body).toEqual(expectedResult);
  });
});
