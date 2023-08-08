import { SETTINGS_SCOPES } from '@tamanu/shared/constants';
import { fake } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../utilities';

describe('Settings Editor', () => {
  let ctx;
  let models;
  let baseApp;
  let adminApp;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.store.models;
    adminApp = await baseApp.asRole('admin');
  });

  afterAll(async () => {
    await ctx.close();
  });

  const saveSettings = async (settings, facilityId = null, scope) => {
    const response = await adminApp.put('/v1/admin/settings').send({
      settings,
      facilityId,
      scope,
    });
    return response;
  };

  const getSettings = async (facilityId = null, scope) => {
    const response = await adminApp.get('/v1/admin/settings').query({ facilityId, scope });
    return response;
  };

  it('Can set and get settings by scope using admin endpoints', async () => {
    const SETTINGS_JSON_EXAMPLES = {
      [SETTINGS_SCOPES.CENTRAL]: {
        centralKey: 'centralValue',
      },
      [SETTINGS_SCOPES.GLOBAL]: {
        globalKey: 'globalValue',
      },
      [SETTINGS_SCOPES.FACILITY]: {
        facilityKey: 'facilityValue',
      },
    };

    const { Facility } = models;
    const facility = await Facility.create(fake(models.Facility));

    // Loop through each scope and do a put request with the settings object and scope to save to DB
    const saveResponses = await Promise.all(
      Object.values(SETTINGS_SCOPES).map(async scope => {
        const facilityId = scope === SETTINGS_SCOPES.FACILITY ? facility.id : null;
        const putResponse = await saveSettings(SETTINGS_JSON_EXAMPLES[scope], facilityId, scope);
        return putResponse;
      }),
    );

    // Ensure all saving responses were successful
    saveResponses.forEach(response => {
      expect(response).toHaveSucceeded();
    });

    // Loop through each scope and get the json object of settings saved to the DB when fetching by scope
    const getResponses = await Promise.all(
      Object.values(SETTINGS_SCOPES).map(async scope => {
        const facilityId = scope === SETTINGS_SCOPES.FACILITY ? facility.id : null;

        // const getResponse = await adminApp.get('/v1/admin/settings').query({ scope, facilityId });
        const getResponse = await getSettings(facilityId, scope);
        return { getResponse, scope };
      }),
    );
    // Ensure that the response was successful and the json fetched from the get endpoint is the same as the JSON saved on the put
    getResponses.forEach(({ getResponse, scope }) => {
      expect(getResponse).toHaveSucceeded();
      expect(getResponse.body).toEqual(SETTINGS_JSON_EXAMPLES[scope]);
    });
  });

  it('Will only get settings from the selected facility', async () => {
    const FACILITY_1_JSON = {
      facilityId: 'facility1',
    };
    const FACILITY_2_JSON = {
      facilityId: 'facility2',
    };

    await models.Setting.truncate({ cascade: true, force: true });
    const { Facility } = models;
    const facility1 = await Facility.create(fake(models.Facility));
    const facility2 = await Facility.create(fake(models.Facility));

    await saveSettings(FACILITY_1_JSON, facility1.id, SETTINGS_SCOPES.FACILITY);
    await saveSettings(FACILITY_2_JSON, facility2.id, SETTINGS_SCOPES.FACILITY);

    const facility1Fetch = await getSettings(facility1.id, SETTINGS_SCOPES.FACILITY);
    expect(facility1Fetch).toHaveSucceeded();
    const facility1Data = facility1Fetch.body;

    const facility2Fetch = await getSettings(facility2.id, SETTINGS_SCOPES.FACILITY);
    expect(facility2Fetch).toHaveSucceeded();
    const facility2Data = facility2Fetch.body;

    expect(facility1Data).toEqual(FACILITY_1_JSON);
    expect(facility2Data).toEqual(FACILITY_2_JSON);
  });

  it.todo('Should be able to edit a the key of a key-value pair');
  it.todo('Should be able to delete a key-value pair');
});
