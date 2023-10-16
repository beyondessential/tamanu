import { LANGUAGE_CODES } from '@tamanu/constants';
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

  describe('POST /', () => {
    it('should create a new translated string', async () => {
      const stringId = 'test-string';
      const result = await app.post('/v1/translation').send({
        stringId,
        fallback: 'test-fallback',
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toEqual(
        expect.objectContaining({
          id: `${stringId};${LANGUAGE_CODES.ENGLISH}`,
          stringId,
          text: 'test-fallback',
          language: LANGUAGE_CODES.ENGLISH,
        }),
      );
    });
  });
});
