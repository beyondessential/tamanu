import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Op } from 'sequelize';
import { LAB_REQUEST_STATUSES, REFERENCE_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { settingsCache } from '@tamanu/settings';

import { createTestContext } from './utilities';

const DISPLAY_ID = 'WIDGET1';
const UNPUBLISHED_DISPLAY_ID = 'WIDGET2';
const endpointFor = displayId => `/v1/public/labResultWidget/${displayId}`;
const ENDPOINT = endpointFor(DISPLAY_ID);

describe('Lab result widget', () => {
  let ctx;
  let baseApp;
  let models;
  let category;
  let unlistedCategory;
  let labTestType;

  beforeAll(async () => {
    // Limiters are no-ops under NODE_ENV=test unless opted in when the app is built.
    process.env.TEST_RATE_LIMITING = 'enabled';
    try {
      ctx = await createTestContext();
    } finally {
      delete process.env.TEST_RATE_LIMITING;
    }
    baseApp = ctx.baseApp;
    models = ctx.store.models;

    // The category the widget used to answer for out of the box.
    category = await models.ReferenceData.create({
      id: 'labTestCategory-COVID',
      type: REFERENCE_TYPES.LAB_TEST_CATEGORY,
      name: 'COVID-19',
      code: 'COVID',
    });
    labTestType = await models.LabTestType.create(
      fake(models.LabTestType, { labTestCategoryId: category.id }),
    );

    const patient = await models.Patient.create(
      fake(models.Patient, { firstName: 'Ana', middleName: 'Bea', lastName: 'Cruz' }),
    );
    const facility = await models.Facility.create(fake(models.Facility));
    const location = await models.Location.create(
      fake(models.Location, { facilityId: facility.id }),
    );
    const department = await models.Department.create(
      fake(models.Department, { facilityId: facility.id }),
    );
    const examiner = await models.User.create(fake(models.User));
    const encounter = await models.Encounter.create(
      fake(models.Encounter, {
        patientId: patient.id,
        locationId: location.id,
        departmentId: department.id,
        examinerId: examiner.id,
      }),
    );
    const labRequest = await models.LabRequest.create(
      fake(models.LabRequest, {
        displayId: DISPLAY_ID,
        encounterId: encounter.id,
        labTestCategoryId: category.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
      }),
    );
    await models.LabTest.create(
      fake(models.LabTest, {
        labRequestId: labRequest.id,
        labTestTypeId: labTestType.id,
        result: 'Negative',
      }),
    );

    // Another patient's request under the same display ID, in another category.
    unlistedCategory = await models.ReferenceData.create(
      fake(models.ReferenceData, { type: REFERENCE_TYPES.LAB_TEST_CATEGORY }),
    );
    const otherPatient = await models.Patient.create(
      fake(models.Patient, { firstName: 'Xia', middleName: 'Yan', lastName: 'Zhu' }),
    );
    const otherEncounter = await models.Encounter.create(
      fake(models.Encounter, {
        patientId: otherPatient.id,
        locationId: location.id,
        departmentId: department.id,
        examinerId: examiner.id,
      }),
    );
    await models.LabRequest.create(
      fake(models.LabRequest, {
        displayId: DISPLAY_ID,
        encounterId: otherEncounter.id,
        labTestCategoryId: unlistedCategory.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
      }),
    );

    const unpublishedLabRequest = await models.LabRequest.create(
      fake(models.LabRequest, {
        displayId: UNPUBLISHED_DISPLAY_ID,
        encounterId: encounter.id,
        labTestCategoryId: category.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
      }),
    );
    await models.LabTest.create(
      fake(models.LabTest, {
        labRequestId: unpublishedLabRequest.id,
        labTestTypeId: labTestType.id,
        result: 'Positive',
      }),
    );
  });

  const listWidgetCategoryAndTestType = async () => {
    await models.Setting.set(
      'labResultWidget',
      { categoryWhitelist: [category.id], testTypeWhitelist: [labTestType.id] },
      SETTINGS_SCOPES.CENTRAL,
    );
    settingsCache.reset();
  };

  afterEach(async () => {
    await models.Setting.destroy({
      where: {
        [Op.or]: [
          { key: { [Op.like]: 'labResultWidget.%' } },
          { key: 'security.cors.allowedOrigin' },
        ],
      },
    });
    settingsCache.reset();
  });

  afterAll(() => ctx.close());

  it('returns nothing until the deployment lists categories', async () => {
    const res = await baseApp.get(ENDPOINT);
    expect(res).toHaveSucceeded();
    expect(res.body).toEqual({ data: [] });
  });

  it('returns results for listed categories and test types', async () => {
    await listWidgetCategoryAndTestType();

    const res = await baseApp.get(ENDPOINT);
    expect(res).toHaveSucceeded();
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.data).toEqual([
      expect.objectContaining({ patientInitials: 'ABC', testResults: [{ result: 'Negative' }] }),
    ]);
  });

  it('returns requests only from listed categories', async () => {
    await models.Setting.set(
      'labResultWidget.categoryWhitelist',
      [category.id, unlistedCategory.id],
      SETTINGS_SCOPES.CENTRAL,
    );
    settingsCache.reset();

    const res = await baseApp.get(ENDPOINT);
    expect(res.body.data.map(({ patientInitials }) => patientInitials).sort()).toEqual([
      'ABC',
      'XYZ',
    ]);
  });

  it('withholds results for test types not listed', async () => {
    await models.Setting.set(
      'labResultWidget.categoryWhitelist',
      [category.id],
      SETTINGS_SCOPES.CENTRAL,
    );
    settingsCache.reset();

    const res = await baseApp.get(ENDPOINT);
    expect(res.body.data).toEqual([
      expect.objectContaining({ patientInitials: 'ABC', testResults: [] }),
    ]);
  });

  it('withholds results until the request is published', async () => {
    await listWidgetCategoryAndTestType();

    const res = await baseApp.get(endpointFor(UNPUBLISHED_DISPLAY_ID));
    expect(res).toHaveSucceeded();
    expect(res.body.data).toEqual([
      expect.objectContaining({ patientInitials: 'ABC', testResults: [] }),
    ]);
  });

  it('refuses lookups past the limit, including ones that find nothing', async () => {
    const allowedOrigin = 'https://results.example.org';
    await models.Setting.set('security.cors.allowedOrigin', allowedOrigin, SETTINGS_SCOPES.CENTRAL);
    settingsCache.reset();
    const max = await ctx.settings.get('rateLimit.labResultWidget.max');

    // Its own client address, so the other cases' lookups don't count towards this budget.
    const lookup = () => baseApp.get(ENDPOINT).set('X-Forwarded-For', '203.0.113.7');
    for (let i = 0; i < max; i++) {
      const res = await lookup();
      expect(res).toHaveSucceeded();
      expect(res.body).toEqual({ data: [] });
    }

    const refused = await lookup();
    expect(refused.status).toBe(429);
    expect(refused.headers['retry-after']).toBeDefined();
    expect(refused.headers['access-control-allow-origin']).toBe(allowedOrigin);
  });
});
