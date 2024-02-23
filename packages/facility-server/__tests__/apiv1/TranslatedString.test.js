import { fake } from '@tamanu/shared/test-helpers/fake';
import Chance from 'chance';
import { createTestContext } from '../utilities';

const chance = new Chance();

const LANGUAGE_CODES = {
  ENGLISH: 'en',
  KHMER: 'km',
  FRENCH: 'fr',
  SPANISH: 'es',
};

const LANGUAGE_NAMES = {
  [LANGUAGE_CODES.ENGLISH]: '🇬🇧 English',
  [LANGUAGE_CODES.FRENCH]: '🇫🇷 Français',
  [LANGUAGE_CODES.SPANISH]: '🇪🇸 Español',
  [LANGUAGE_CODES.KHMER]: '🇰🇭 ភាសាខ្មែរ',
};

describe('TranslatedString', () => {
  let ctx = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let englishTranslations = null;
  let khmerTranslations = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    app = await baseApp.asRole('practitioner');
    englishTranslations = await seedTranslationsForLanguage(LANGUAGE_CODES.ENGLISH);
    khmerTranslations = await seedTranslationsForLanguage(LANGUAGE_CODES.KHMER);
  });

  afterAll(() => ctx.close());

  const seedTranslationsForLanguage = async (language, count = 5) => {
    const { TranslatedString } = models;
    const tStrings = await Promise.all(
      Array.from({ length: count }).map(async (value, i) =>
        (
          await TranslatedString.create({
            ...fake(TranslatedString),
            stringId: i === 0 ? 'languageName' : `${language}.${i}`,
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

  describe('/prelogin GET', () => {
    it('Should receive a list of languages stored in the DB in the format of select options', async () => {
      const result = await app.get('/v1/public/translation/preLogin');
      expect(result).toHaveSucceeded();

      const expectedResult = [
        { label: LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH], value: LANGUAGE_CODES.ENGLISH },
        { label: LANGUAGE_NAMES[LANGUAGE_CODES.KHMER], value: LANGUAGE_CODES.KHMER },
      ];
      expect(result.body).toEqual(expectedResult);
    });
  });

  describe('/translation/:languageCode GET', () => {
    it('Should receive a dictionary of all translated text for selected language keyed by stringId', async () => {
      const englishResult = await app.get(`/v1/translation/${LANGUAGE_CODES.ENGLISH}`);
      expect(englishResult).toHaveSucceeded();
      expect(englishResult.body).toEqual(englishTranslations);

      const khmerResult = await app.get(`/v1/translation/${LANGUAGE_CODES.KHMER}`);
      expect(khmerResult).toHaveSucceeded();
      expect(khmerResult.body).toEqual(khmerTranslations);
    });
  });

  describe('/ POST', () => {
    it('should create a new translated string', async () => {
      const mockText = 'test-fallback';
      const stringId = 'test-string';
      const result = await app.post('/v1/translation').send({
        stringId,
        fallback: mockText,
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual(
        expect.objectContaining({
          id: `${stringId};${LANGUAGE_CODES.ENGLISH}`,
          stringId,
          text: mockText,
          language: LANGUAGE_CODES.ENGLISH,
        }),
      );
    });
  });
});
