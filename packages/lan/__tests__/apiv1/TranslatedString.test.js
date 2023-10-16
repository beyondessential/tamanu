import { LANGUAGE_CODES, LANGUAGE_NAMES } from '@tamanu/constants';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from '../utilities';

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

  describe('Selecting language on login', () => {
    it('Should recieve a list of languages stored in the DB in the format of select options', async () => {
      const { TranslatedString } = models;

      await TranslatedString.create({
        ...fake(TranslatedString),
        language: LANGUAGE_CODES.ENGLISH,
      });
      await TranslatedString.create({
        ...fake(TranslatedString),
        language: LANGUAGE_CODES.KHMER,
      });

      const result = await app.get('/v1/translation/preLogin');
      expect(result).toHaveSucceeded();

      const expectedResult = [
        { label: LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH], value: LANGUAGE_CODES.ENGLISH },
        { label: LANGUAGE_NAMES[LANGUAGE_CODES.KHMER], value: LANGUAGE_CODES.KHMER },
      ];
      expect(result.body).toEqual(expectedResult);
    });
  });
});
