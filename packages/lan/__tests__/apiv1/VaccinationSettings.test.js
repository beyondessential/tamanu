import config from 'config';

import { Setting } from 'shared/models/Setting';
import { fake } from 'shared/test-helpers/fake';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { createTestContext } from '../utilities';

describe('Vaccination Settings', () => {
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

  describe('GET vaccinationSettings/:key', () => {
    it('fetches a vaccination setting record from the current facility', async () => {
      await models.Facility.upsert({
        id: config.serverFacilityId,
        name: config.serverFacilityId,
        code: config.serverFacilityId,
      });

      const TEST_KEY = 'vaccinations.test.key';
      const TEST_VALUE = 'test-value';

      await Setting.set(TEST_KEY, TEST_VALUE, config.serverFacilityId, SETTINGS_SCOPES.FACILITY);

      const result = await app.get(`/v1/vaccinationSettings/${TEST_KEY}`).send({});

      expect(result).toHaveSucceeded();
      expect(result.body.data).toEqual(TEST_VALUE);
    });

    it('does not fetch a vaccination setting record from a different facility', async () => {
      const anotherFacility = await models.Facility.create(fake(models.Facility));

      const TEST_KEY = 'vaccinations.test.key2';
      const TEST_VALUE = 'test-value';

      await Setting.set(TEST_KEY, TEST_VALUE, anotherFacility.id, SETTINGS_SCOPES.FACILITY);

      const result = await app.get(`/v1/vaccinationSettings/${TEST_KEY}`).send({});

      expect(result).toHaveSucceeded();
      expect(result.body.data).toEqual(null);
    });
  });
});
