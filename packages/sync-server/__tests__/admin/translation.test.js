import { createTestContext } from '../utilities';

const LANGUAGE_CODES = {
  ENGLISH: 'en',
  KHMER: 'km',
};

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
    await mockTranslatedString('languageName', 'English', LANGUAGE_CODES.ENGLISH);
    await mockTranslatedString('languageName', 'ខ្មែរ', LANGUAGE_CODES.KHMER);
  });

  afterAll(async () => {
    await models.TranslatedString.truncate();
    await ctx.close();
  });

  describe('GET /', () => {
    it('should return all translated strings', async () => {
      const result = await adminApp.get('/v1/admin/translation');
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual({
        translations: [
          { stringId: 'languageName', en: 'English', km: 'ខ្មែរ' },
          { stringId: 'login.email', en: 'Email', km: null },
          { stringId: 'login.password', en: 'Password', km: 'អ៊ីមែល' },
          { stringId: 'login.register', en: null, km: 'ចុះ​ឈ្មោះ' },
        ],
        languageNames: { en: 'English', km: 'ខ្មែរ' },
      });
    });
  });

  describe('PUT /', () => {
    it('should create new translated strings if not existing', async () => {
      const result = await adminApp.put('/v1/admin/translation').send({
        'login.email': { km: 'អ៊ីមែល' },
        'login.register': { en: 'Register' },
      });
      expect(result).toHaveSucceeded();
      expect(result.status).toEqual(201);
      expect(result.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stringId: 'login.email',
            text: 'អ៊ីមែល',
            language: LANGUAGE_CODES.KHMER,
          }),
          expect.objectContaining({
            stringId: 'login.register',
            text: 'Register',
            language: LANGUAGE_CODES.ENGLISH,
          }),
        ]),
      );
    });
    it('should update translated strings if existing', async () => {
      await models.TranslatedString.create({
        stringId: 'general.back',
        text: 'ត្រឡប់មកវិញ',
        language: LANGUAGE_CODES.KHMER,
      });
      await models.TranslatedString.create({
        stringId: 'general.submit',
        text: 'Submit',
        language: LANGUAGE_CODES.ENGLISH,
      });
      const result = await adminApp.put('/v1/admin/translation').send({
        'general.submit': { en: 'Confirm' },
        'general.back': { km: 'ត្រឡប់មកវិញ' },
      });
      expect(result).toHaveSucceeded();
      expect(result.status).toEqual(200);
      expect(result.body).toEqual({ ok: 'ok' });
      const updatedTranslatedStrings = await models.TranslatedString.findAll({
        where: { stringId: ['general.submit', 'general.back'] },
        order: [['stringId', 'ASC']],
        attributes: ['stringId', 'text', 'language'],
      });
      expect(
        updatedTranslatedStrings.map(translatedString => translatedString.get({ plain: true })),
      ).toEqual([
        { stringId: 'general.back', text: 'ត្រឡប់មកវិញ', language: LANGUAGE_CODES.KHMER },
        { stringId: 'general.submit', text: 'Confirm', language: LANGUAGE_CODES.ENGLISH },
      ]);
    });
  });
});
