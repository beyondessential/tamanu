import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sortBy } from 'es-toolkit/compat';
import { createTestContext } from '../utilities';

const ENGLISH_TRANSLATIONS = {
  'patient.property.sex.male': 'Male',
  'patient.property.sex.female': 'Female',
  languageName: 'English',
  countryCode: 'gb',
};

const FRENCH_TRANSLATIONS = {
  'patient.property.sex.male': 'Homme',
  languageName: 'Français',
  countryCode: 'fr',
};

describe('Patient Portal Translations', () => {
  let baseApp;
  let models;
  let close;

  const seedTranslations = async (language, translations) => {
    for (const [stringId, text] of Object.entries(translations)) {
      await models.TranslatedString.create({ stringId, text, language });
    }
  };

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    models = ctx.store.models;

    await models.Setting.set('features.patientPortal', true);

    await models.TranslatedString.truncate({ force: true });
    await seedTranslations('en', ENGLISH_TRANSLATIONS);
    await seedTranslations('fr', FRENCH_TRANSLATIONS);
  });

  afterAll(async () => {
    await models.TranslatedString.truncate({ force: true });
    await close();
  });

  describe('GET /api/portal/translation/:language', () => {
    it('returns the translations for the requested language without authentication', async () => {
      const response = await baseApp.get('/api/portal/translation/en');

      expect(response).toHaveSucceeded();
      expect(response.body).toEqual(ENGLISH_TRANSLATIONS);
    });

    it('ignores an invalid authentication token', async () => {
      const response = await baseApp
        .get('/api/portal/translation/en')
        .set('Authorization', 'Bearer invalid-token');

      expect(response).toHaveSucceeded();
      expect(response.body).toEqual(ENGLISH_TRANSLATIONS);
    });

    it('returns an empty object for an unknown language', async () => {
      const response = await baseApp.get('/api/portal/translation/xx');

      expect(response).toHaveSucceeded();
      expect(response.body).toEqual({});
    });
  });

  describe('GET /api/portal/translation/languageOptions', () => {
    it('returns the languages present in the database', async () => {
      const response = await baseApp.get('/api/portal/translation/languageOptions');

      expect(response).toHaveSucceeded();

      const { languagesInDb, languageNames, countryCodes } = response.body;
      expect(sortBy(languagesInDb, ['language']).map(({ language }) => language)).toEqual([
        'en',
        'fr',
      ]);
      expect(languageNames.map(({ text }) => text).sort()).toEqual(['English', 'Français']);
      expect(countryCodes.map(({ text }) => text).sort()).toEqual(['fr', 'gb']);
    });
  });
});
