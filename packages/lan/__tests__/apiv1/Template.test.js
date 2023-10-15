import { Setting } from 'shared/models/Setting';
import { fake } from 'shared/test-helpers/fake';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

describe('Template', () => {
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
    await models.Facility.truncate({ cascade: true });
    await models.Setting.truncate();
  });

  afterAll(() => ctx.close());

  describe('GET template/:key', () => {
    const TEST_KEY = 'templates.test.key';
    const TEST_VALUE = 'test-value';

    it('fetches a template record within a facility', async () => {
      const facility = await models.Facility.create(fake(models.Facility));
      await Setting.set(TEST_KEY, TEST_VALUE, SETTINGS_SCOPES.FACILITY, facility.id);

      const result = await app.get(`/v1/template/${TEST_KEY}?facilityId=${facility.id}`).send({});

      expect(result).toHaveSucceeded();
      expect(result.body.data).toEqual(TEST_VALUE);
    });

    it('does not fetch a template record within a different facility', async () => {
      const facility1 = await models.Facility.create(fake(models.Facility));
      const facility2 = await models.Facility.create(fake(models.Facility));
      await Setting.set(TEST_KEY, TEST_VALUE, SETTINGS_SCOPES.FACILITY, facility1.id);

      const result = await app.get(`/v1/template/${TEST_KEY}?facilityId=${facility2.id}`).send({});

      expect(result).toHaveSucceeded();
      expect(result.body.data).toEqual(null);
    });
  });
});
