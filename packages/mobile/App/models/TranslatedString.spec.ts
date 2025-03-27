import { Database } from '~/infra/db';

beforeAll(async () => {
  await Database.connect();
});

describe('TranslatedString', () => {
  describe('getForLanguage', () => {
    it('gets translated strings for language', async () => {
      const translatedStrings = [
        { language: 'en', stringId: 'login.username', text: 'Username' },
        { language: 'en', stringId: 'login.password', text: 'Password' },
        { language: 'km', stringId: 'login.username', text: 'ឈ្មោះអ្នកប្រើប្រាស់' },
        { language: 'km', stringId: 'login.password', text: 'ពាក្យសម្ងាត់' },
      ];
      await Database.models.TranslatedString.insert(translatedStrings);

      const result = await Database.models.TranslatedString.getForLanguage('en');
      expect(result).toEqual({
        'login.username': 'Username',
        'login.password': 'Password',
      });
    });
  });

  describe('getLanguageOptions', () => {
    it('gets language options', async () => {
      const translatedStrings = [
        { language: 'en', stringId: 'languageName', text: 'English' },
        { language: 'km', stringId: 'languageName', text: 'Khmer' },
        { language: 'en', stringId: 'countryCode', text: 'gb' },
        { language: 'km', stringId: 'countryCode', text: 'km' },
      ];
      await Database.models.TranslatedString.insert(translatedStrings);

      const result = await Database.models.TranslatedString.getLanguageOptions();
      expect(result).toEqual([
        { languageCode: 'en', label: 'English', countryCode: 'gb' },
        { languageCode: 'km', label: 'Khmer', countryCode: 'km' },
      ]);
    });
  });
});
