import config from 'config';

import { Setting } from '@tamanu/shared/models/Setting';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../utilities';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { selectFacilityIds } from '@tamanu/shared/utils/configSelectors';

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
      const [facilityId] = selectFacilityIds(config);
      await models.Facility.upsert({
        id: facilityId,
        name: facilityId,
        code: facilityId,
      });

      const TEST_KEY = 'vaccinations.test.key';
      const TEST_VALUE = 'test-value';

      await Setting.set(TEST_KEY, TEST_VALUE, SETTINGS_SCOPES.FACILITY, facilityId);

      const result = await app.get(`/api/vaccinationSettings/${TEST_KEY}`).send({});

      expect(result).toHaveSucceeded();
      expect(result.body.data).toEqual(TEST_VALUE);
    });

    it('does not fetch a vaccination setting record from a different facility', async () => {
      const anotherFacility = await models.Facility.create(fake(models.Facility));

      const TEST_KEY = 'vaccinations.test.key2';
      const TEST_VALUE = 'test-value';

      await Setting.set(TEST_KEY, TEST_VALUE, anotherFacility.id);

      const result = await app.get(`/api/vaccinationSettings/${TEST_KEY}`).send({});

      expect(result).toHaveSucceeded();
      expect(result.body.data).toEqual(null);
    });
  });
});
