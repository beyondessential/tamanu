import { Database } from '~/infra/db';

beforeAll(async () => {
  await Database.connect();
});

describe('TranslatedString', () => {
  describe('getLanguageOptions', () => {
    it('gets language options', async () => {
      const translatedStrings = [
        { language: 'en', stringId: 'languageName', text: 'English' },
        { language: 'km', stringId: 'languageName', text: 'Khmer' },
      ];
      await Database.models.TranslatedString.insert(translatedStrings);

      const result = await Database.models.TranslatedString.getLanguageOptions();
      expect(result).toEqual([
        { value: 'en', label: 'English' },
        { value: 'km', label: 'Khmer' },
      ]);
    });
  });
});