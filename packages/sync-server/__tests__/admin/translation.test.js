import { LANGUAGE_CODES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

describe('Translation', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;

  const mockTranslatedString = async (stringId, text, language) => {
    await models.TranslatedString.create({
      stringId,
      text,
      language,
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');

    await models.TranslatedString.truncate();

    // Create a stringId with both languages, and two stringIds with only one language
    await mockTranslatedString('login.email', 'Email', LANGUAGE_CODES.ENGLISH);
    await mockTranslatedString('login.register', 'ចុះ​ឈ្មោះ', LANGUAGE_CODES.KHMER);
    await mockTranslatedString('login.password', 'Password', LANGUAGE_CODES.ENGLISH);
    await mockTranslatedString('login.password', 'អ៊ីមែល', LANGUAGE_CODES.KHMER);
  });

  afterAll(() => ctx.close());

  describe('GET /', () => {
    it('should return all translated strings', async () => {
      const result = await adminApp.get('/v1/admin/translation');
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual([
        { stringId: 'login.email', en: 'Email', km: null },
        { stringId: 'login.password', en: 'Password', km: 'អ៊ីមែល' },
        { stringId: 'login.register', en: null, km: 'ចុះ​ឈ្មោះ' },
      ]);
    });
  });
});
