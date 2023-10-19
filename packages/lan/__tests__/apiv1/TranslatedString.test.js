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
    const createdTranslations = [];

    // Need this initial languageName translation to be able to check the language select options endpoint
    const languageNameTranslation = await TranslatedString.create({
      ...fake(TranslatedString),
      stringId: `languageName`,
      text: LANGUAGE_NAMES[language],
      language,
    });
    createdTranslations.push(languageNameTranslation.get({ plain: true }));

    for (let i = 0; i < count; i++) {
      const translation = await TranslatedString.create({
        ...fake(TranslatedString),
        stringId: `${chance.word()}.${chance.word()}`,
        text: chance.sentence(),
        language,
      });
      createdTranslations.push(translation.get({ plain: true }));
    }
    return createdTranslations;
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

  it('Should recieve a list of all translations for selected language in an object with format { [stringId]: text, ... }', async () => {
    const englishTranslations = await seedTranslationsForLanguage(LANGUAGE_CODES.ENGLISH);
    const khmerTranslations = await seedTranslationsForLanguage(LANGUAGE_CODES.KHMER);

    const englishResult = await app.get('/v1/translation/en');
    expect(englishResult).toHaveSucceeded();

    const expectedEnglishTranslationObject = Object.fromEntries(
      englishTranslations.map(({ stringId, text }) => [stringId, text]),
    );
    expect(englishResult.body).toEqual(expectedEnglishTranslationObject);

    const khmerResult = await app.get('/v1/translation/km');
    expect(khmerResult).toHaveSucceeded();

    const expectedKhmerTranslationObject = Object.fromEntries(
      khmerTranslations.map(({ stringId, text }) => [stringId, text]),
    );
    expect(khmerResult.body).toEqual(expectedKhmerTranslationObject);
  });
});
