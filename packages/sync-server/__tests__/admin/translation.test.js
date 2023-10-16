import { createTestContext } from '../utilities';
import { LANGUAGE_CODES } from '@tamanu/constants';

describe('Translation', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;

  const mockTranslatedString = async (id, text, language) => {
    await models.TranslatedString.create({
      stringId: id,
      text,
      language,
    });
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');

    // Create a stringId with both languages, and two stringIds with only one language
    await mockTranslatedString('login.email', 'Email', LANGUAGE_CODES.ENGLISH);
    await mockTranslatedString('login.register', 'ចុះ​ឈ្មោះ', LANGUAGE_CODES.KHMER);
    await mockTranslatedString('login.password', 'Password', LANGUAGE_CODES.ENGLISH);
    await mockTranslatedString('login.password', 'អ៊ីមែល', LANGUAGE_CODES.KHMER);
  });
});
