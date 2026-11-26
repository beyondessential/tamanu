import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import config from 'config';

import { createDummyPatient } from '@tamanu/database/demoData/patients';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { setupSyndromicSurveillanceSurvey } from '../setupSurvey';
import { createTestContext } from '../utilities';

describe('Sending a form to the patient portal', () => {
  const [facilityId] = selectFacilityIds(config);
  let ctx;
  let models;
  let app;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.models;
    app = await ctx.baseApp.asRole('practitioner');
  });

  afterAll(() => ctx.close());

  it('refuses the syndromic surveillance form', async () => {
    const syndromicSurveillanceSurvey = await setupSyndromicSurveillanceSurvey(models);
    const patient = await models.Patient.create(await createDummyPatient(models));

    const result = await app.post(`/api/patient/${patient.id}/portal/forms`).send({
      formId: syndromicSurveillanceSurvey.id,
      assignedAt: getCurrentDateTimeString(),
      email: 'patient@example.com',
      facilityId,
    });

    expect(result).toHaveRequestError();
    expect(result.body.error.message).toContain('Syndromic surveillance');
    expect(await models.PortalUser.count({ where: { patientId: patient.id } })).toEqual(0);
    expect(await models.PortalSurveyAssignment.count({ where: { patientId: patient.id } })).toEqual(
      0,
    );
  });
});
