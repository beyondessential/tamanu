import { fake } from 'shared/test-helpers/fake';
import Chance from 'chance';
import { createTestContext } from '../utilities';

const chance = new Chance();

const LANGUAGE_CODES = {
  ENGLISH: 'en',
  KHMER: 'km',
};

const LANGUAGE_NAMES = {
  [LANGUAGE_CODES.ENGLISH]: '🇬🇧 English',
  [LANGUAGE_CODES.KHMER]: '🇰🇭 ភាសាខ្មែរ',
};

describe('TranslatedString', () => {
  let ctx = null;
  let app = null;
  let baseApp = null;
  let models = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
  });

  beforeEach(async () => {
    await models.TranslatedString.truncate();
  });

  afterAll(() => ctx.close());

  const seedTranslationsForLanguage = async (language, count = 5) => {
    const { TranslatedString } = models;
    const tStrings = await Promise.all(
      Array.from({ length: count }).map(async (value, i) =>
        (
          await TranslatedString.create({
            ...fake(TranslatedString),
            stringId: i === 0 ? 'languageName' : `${chance.word()}.${chance.word()}`,
            text: i === 0 ? LANGUAGE_NAMES[language] : chance.sentence(),
            language,
          })
        ).get({
          plain: true,
        }),
      ),
    );
    // Return a translation dictionary used in the app
    return Object.fromEntries(tStrings.map(({ stringId, text }) => [stringId, text]));
  };

  it('Should receive a list of languages stored in the DB in the format of select options', async () => {
    await seedTranslationsForLanguage(LANGUAGE_CODES.ENGLISH);
    await seedTranslationsForLanguage(LANGUAGE_CODES.KHMER);

    const result = await app.get('/v1/translation/preLogin');
    expect(result).toHaveSucceeded();

    const expectedResult = [
      { label: LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH], value: LANGUAGE_CODES.ENGLISH },
      { label: LANGUAGE_NAMES[LANGUAGE_CODES.KHMER], value: LANGUAGE_CODES.KHMER },
    ];
    expect(result.body).toEqual(expectedResult);
  });

  it('Should receive a dictionary of all translated text for selected language keyed by stringId', async () => {
    const englishTranslations = await seedTranslationsForLanguage(LANGUAGE_CODES.ENGLISH);
    const khmerTranslations = await seedTranslationsForLanguage(LANGUAGE_CODES.KHMER);

    const englishResult = await app.get('/v1/translation/en');
    expect(englishResult).toHaveSucceeded();
    expect(englishResult.body).toEqual(englishTranslations);

    const khmerResult = await app.get('/v1/translation/km');
    expect(khmerResult).toHaveSucceeded();
    expect(khmerResult.body).toEqual(khmerTranslations);
  });
});
