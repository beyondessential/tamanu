import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { Op } from 'sequelize';
import { LAB_REQUEST_STATUSES, REFERENCE_TYPES, SETTINGS_SCOPES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { settingsCache } from '@tamanu/settings';
import { buildRateLimiters } from '@tamanu/shared/utils/rateLimit';

import { createTestContext } from './utilities';

const DISPLAY_ID = 'WIDGET1';
const ENDPOINT = `/v1/public/labResultWidget/${DISPLAY_ID}`;

describe('Lab result widget', () => {
  let ctx;
  let baseApp;
  let models;
  let category;
  let labTestType;

  beforeAll(async () => {
    ctx = await createTestContext();
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
  });

  afterEach(async () => {
    await models.Setting.destroy({ where: { key: { [Op.like]: 'labResultWidget.%' } } });
    settingsCache.reset();
  });

  afterAll(() => ctx.close());

  it('returns nothing until the deployment lists categories', async () => {
    const res = await baseApp.get(ENDPOINT);
    expect(res).toHaveSucceeded();
    expect(res.body).toEqual({ data: [] });
  });

  it('returns results for listed categories and test types', async () => {
    await models.Setting.set(
      'labResultWidget',
      { categoryWhitelist: [category.id], testTypeWhitelist: [labTestType.id] },
      SETTINGS_SCOPES.CENTRAL,
    );
    settingsCache.reset();

    const res = await baseApp.get(ENDPOINT);
    expect(res).toHaveSucceeded();
    expect(res.body.data).toEqual([
      expect.objectContaining({ patientInitials: 'ABC', testResults: [{ result: 'Negative' }] }),
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
});

// The limiters are no-ops under NODE_ENV=test unless explicitly opted in, so this
// exercises the widget limiter on a bare express app.
describe('labResultWidgetLimiter', () => {
  const max = 3;
  let agent;

  beforeAll(() => {
    process.env.TEST_RATE_LIMITING = 'enabled';
    const { labResultWidgetLimiter } = buildRateLimiters({
      labResultWidget: { windowMs: 60000, max },
    });
    delete process.env.TEST_RATE_LIMITING;

    const app = express();
    app.get('/lookup', labResultWidgetLimiter, (_req, res) => res.send({ data: [] }));
    // mirror the API error handler enough to surface the RateLimitedError status
    // eslint-disable-next-line no-unused-vars
    app.use((error, _req, res, _next) => res.status(error.status ?? 500).end());
    agent = supertest(app);
  });

  it('counts successful lookups towards the limit', async () => {
    for (let i = 0; i < max; i++) {
      await agent.get('/lookup').expect(200);
    }
    await agent.get('/lookup').expect(429);
  });
});
