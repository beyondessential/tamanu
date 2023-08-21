import { SETTINGS_SCOPES } from '@tamanu/constants';
import { fake, chance } from '@tamanu/shared/test-helpers/fake';
import { createTestContext } from '../utilities';

function generateRandomObject(depth = 1, maxDepth = 3) {
  // Settings values can be either booleans, integers, strings, objects or arrays
  if (depth > maxDepth) {
    return chance.pickone([
      chance.bool(),
      chance.integer(),
      chance.string(),
      [chance.string(), chance.string(), chance.string()],
    ]);
  }

  const object = {};
  const numProperties = chance.integer({ min: 1, max: 5 });

  for (let i = 0; i < numProperties; i++) {
    const key = chance.word();
    const value = generateRandomObject(depth + 1, maxDepth);
    object[key] = value;
  }

  return object;
}

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

  const saveSettings = async (settings, scope = 'global', facilityId = null) => {
    const response = await adminApp.put('/v1/admin/settings').send({
      settings,
      facilityId,
      scope,
    });
    return response;
  };

  const getSettings = async (scope, facilityId = null) => {
    const response = await adminApp.get('/v1/admin/settings').query({ facilityId, scope });
    return response;
  };

  it('Can set and get settings by scope using admin endpoints', async () => {
    // Randomly generated JSON objects to save to the DB
    const scopeTestJsons = {
      [SETTINGS_SCOPES.CENTRAL]: generateRandomObject(),
      [SETTINGS_SCOPES.GLOBAL]: generateRandomObject(),
      [SETTINGS_SCOPES.FACILITY]: generateRandomObject(),
    };

    const { Facility } = models;
    const facility = await Facility.create(fake(models.Facility));

    // Loop through each scope and do a put request with the settings object and scope to save to DB
    const saveResponses = await Promise.all(
      Object.values(SETTINGS_SCOPES).map(async scope => {
        const facilityId = scope === SETTINGS_SCOPES.FACILITY ? facility.id : null;
        const putResponse = await saveSettings(scopeTestJsons[scope], scope, facilityId);
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
        const getResponse = await getSettings(scope, facilityId);
        return { getResponse, scope };
      }),
    );
    // Ensure that the response was successful and the json fetched from the get endpoint is the same as the JSON saved on the put
    getResponses.forEach(({ getResponse, scope }) => {
      expect(getResponse).toHaveSucceeded();
      expect(getResponse.body).toEqual(scopeTestJsons[scope]);
    });
  });

  it('Will only get settings linked to the selected facility', async () => {
    const facility1Json = generateRandomObject();
    const facility2Json = generateRandomObject();

    const { Facility } = models;
    const facility1 = await Facility.create(fake(models.Facility));
    const facility2 = await Facility.create(fake(models.Facility));

    await saveSettings(facility1Json, SETTINGS_SCOPES.FACILITY, facility1.id);
    await saveSettings(facility2Json, SETTINGS_SCOPES.FACILITY, facility2.id);

    const facility1Fetch = await getSettings(SETTINGS_SCOPES.FACILITY, facility1.id);
    expect(facility1Fetch).toHaveSucceeded();
    const facility1Data = facility1Fetch.body;

    const facility2Fetch = await getSettings(SETTINGS_SCOPES.FACILITY, facility2.id);
    expect(facility2Fetch).toHaveSucceeded();
    const facility2Data = facility2Fetch.body;

    expect(facility1Data).toEqual(facility1Json);
    expect(facility2Data).toEqual(facility2Json);
  });

  it('Should be able to delete a key-value pair', async () => {
    const BEFORE_DELETION_JSON = {
      key1: 'value1',
      key2: 'value2',
    };
    const AFTER_DELETION_JSON = {
      key2: 'value2',
    };

    await saveSettings(BEFORE_DELETION_JSON, SETTINGS_SCOPES.GLOBAL);
    const beforeDeletionResponse = await getSettings(SETTINGS_SCOPES.GLOBAL);
    expect(beforeDeletionResponse.body).toEqual(BEFORE_DELETION_JSON);

    await saveSettings(AFTER_DELETION_JSON, SETTINGS_SCOPES.GLOBAL);
    const afterDeletionResponse = await getSettings(SETTINGS_SCOPES.GLOBAL);
    expect(afterDeletionResponse.body).toEqual(AFTER_DELETION_JSON);
  });

  it('Should be able to edit the key of a key-value pair', async () => {
    const BEFORE_EDIT_JSON = {
      beforeEditKey: true,
      controlKey: true,
    };
    const AFTER_EDIT_JSON = {
      afterEditKey: true,
      controlKey: true,
    };

    await saveSettings(BEFORE_EDIT_JSON, SETTINGS_SCOPES.GLOBAL);
    const beforeEditResponse = await getSettings(SETTINGS_SCOPES.GLOBAL);
    expect(beforeEditResponse.body).toEqual(BEFORE_EDIT_JSON);

    await saveSettings(AFTER_EDIT_JSON, SETTINGS_SCOPES.GLOBAL);
    const afterEditResponse = await getSettings(SETTINGS_SCOPES.GLOBAL);
    expect(afterEditResponse.body).toEqual(AFTER_EDIT_JSON);
  });

  it('Should be able to edit the value of a key-value pair', async () => {
    const BEFORE_EDIT_JSON = {
      key: 'beforeEditValue',
      controlKey: true,
    };
    const AFTER_EDIT_JSON = {
      key: 'afterEditValue',
      controlKey: true,
    };

    await saveSettings(BEFORE_EDIT_JSON, SETTINGS_SCOPES.GLOBAL);
    const beforeEditResponse = await getSettings(SETTINGS_SCOPES.GLOBAL);
    expect(beforeEditResponse.body).toEqual(BEFORE_EDIT_JSON);

    await saveSettings(AFTER_EDIT_JSON, SETTINGS_SCOPES.GLOBAL);
    const afterEditResponse = await getSettings(SETTINGS_SCOPES.GLOBAL);
    expect(afterEditResponse.body).toEqual(AFTER_EDIT_JSON);
  });

  it('Should fetch a list of facility names and ids linked to the central server', async () => {
    const { Facility } = models;

    const facilityList = await Facility.findAll({ attributes: ['id', 'name'] });
    const plainFacilityList = facilityList.map(facility => facility.get({ plain: true }));

    const endpointResponse = await adminApp.get('/v1/admin/facilities');
    expect(endpointResponse).toHaveSucceeded();

    expect(endpointResponse.body).toEqual(plainFacilityList);
  });
});
