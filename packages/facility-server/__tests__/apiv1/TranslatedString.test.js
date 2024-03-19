import { fake } from '@tamanu/shared/test-helpers/fake';
import Chance from 'chance';
import { createTestContext } from '../utilities';
import { REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants'

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

  describe('/languageOptions GET', () => {
    it('Should receive an object containing languageNames and languageCodes to be mapped onto options for select field', async () => {
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

  describe('/translation/:languageCode GET', () => {
    it('Should receive a dictionary of all translated text for selected language keyed by stringId', async () => {
      const englishResult = await app.get(`/v1/public/translation/${LANGUAGE_CODES.ENGLISH}`);
      expect(englishResult).toHaveSucceeded();
      expect(englishResult.body).toEqual(englishTranslations);

      const khmerResult = await app.get(`/v1/public/translation/${LANGUAGE_CODES.KHMER}`);
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

  describe('getReferenceDataTranslationsByDataType method', () => {
    it('should return all translations for a given reference data endpoint in a given language', async () => {
      const { TranslatedString } = models;

      const EXPECTED_REFDATA_TYPE = 'icd10';

      const expectedTranslation = await TranslatedString.create({
        stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${EXPECTED_REFDATA_TYPE}.testDisease`,
        text: 'Test disease',
        language: LANGUAGE_CODES.ENGLISH,
      });

      // Response shouldnt include this record as its not english
      await TranslatedString.create({
        stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${EXPECTED_REFDATA_TYPE}.testDisease`,
        text: '១២៣',
        language: LANGUAGE_CODES.KHMER,
      });

      // Response shouldn't include this record as the wrong data type
      await TranslatedString.create({
        stringId: `${REFERENCE_DATA_TRANSLATION_PREFIX}.village.testVillage`,
        text: 'Test Village',
        language: LANGUAGE_CODES.ENGLISH,
      });

      const translations = await TranslatedString.getReferenceDataTranslationsByDataType({
        language: LANGUAGE_CODES.ENGLISH,
        refDataType: EXPECTED_REFDATA_TYPE,
      });

      expect(translations).toHaveLength(1);
      expect(expectedTranslation.get({ plain: true })).toMatchObject(
        translations[0].get({ plain: true }),
      );
    });
  });
});
