import Chance from 'chance';
import moment from 'moment';

import {
  createDummyPatient,
  createDummyVisit,
  createDummyTriage,
  randomReferenceId,
  randomUser,
} from 'shared/demoData/patients';
import { VISIT_TYPES } from 'shared/constants';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

const chance = new Chance();

describe('Triage', () => {
  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
  });

  it('should admit a patient to triage', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const response = await app.post('/v1/triage').send(
      await createDummyTriage(models, {
        patientId: visitPatient.id,
      }),
    );
    expect(response).toHaveSucceeded();

    const createdTriage = await models.Triage.findByPk(response.body.id);
    expect(createdTriage).toBeTruthy();
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();
  });

  it('should fail to triage if a visit is already open', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const visit = await models.Visit.create(
      await createDummyVisit(models, {
        current: true,
        patientId: visitPatient.id,
      }),
    );

    expect(visit.endDate).toBeFalsy();

    const response = await app.post('/v1/triage').send(
      await createDummyTriage(models, {
        patientId: visitPatient.id,
      }),
    );
    expect(response).toHaveRequestError();
  });

  it('should successfully triage if the existing visit is closed', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const visit = await models.Visit.create(
      await createDummyVisit(models, {
        current: false,
        patientId: visitPatient.id,
      }),
    );

    expect(visit.endDate).toBeTruthy();

    const response = await app.post('/v1/triage').send(
      await createDummyTriage(models, {
        patientId: visitPatient.id,
      }),
    );
    expect(response).toHaveSucceeded();
  });

  it('should close a triage by progressing a visit', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: visitPatient.id,
      }),
    );
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();

    const progressResponse = await app.put(`/v1/visit/${createdVisit.id}`).send({
      visitType: VISIT_TYPES.EMERGENCY,
    });
    expect(progressResponse).toHaveSucceeded();
    const updatedTriage = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage.closedTime).toBeTruthy();
  });

  it('should close a triage by discharging a visit', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: visitPatient.id,
      }),
    );
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();

    const progressResponse = await app.put(`/v1/visit/${createdVisit.id}`).send({
      endDate: Date.now(),
    });
    expect(progressResponse).toHaveSucceeded();
    const updatedTriage = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage.closedTime).toBeTruthy();
  });

  it('should set the visit reason to the text of the chief complaints', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: visitPatient.id,
        chiefComplaintId: await randomReferenceId(models, 'triageReason'),
        secondaryComplaintId: null,
      }),
    );
    const reason = await models.ReferenceData.findByPk(createdTriage.chiefComplaintId);
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();
    expect(createdVisit.reasonForVisit).toContain(reason.name);
  });

  it('should concatenate multiple visit reasons', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(
      await createDummyTriage(models, {
        patientId: visitPatient.id,
        chiefComplaintId: await randomReferenceId(models, 'triageReason'),
        secondaryComplaintId: await randomReferenceId(models, 'triageReason'),
      }),
    );
    const chiefReason = await models.ReferenceData.findByPk(createdTriage.chiefComplaintId);
    const secondaryReason = await models.ReferenceData.findByPk(createdTriage.secondaryComplaintId);
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();
    expect(createdVisit.reasonForVisit).toContain(chiefReason.name);
    expect(createdVisit.reasonForVisit).toContain(secondaryReason.name);
  });

  describe('listing & filtering', () => {
    beforeAll(() => {
      // create a few test triages
    });

    test.todo('should get a list of all triages with relevant attached data');
    test.todo('should filter triages by location');
    test.todo('should filter triages by age range');
    test.todo('should filter triages by chief complaint');
  });
});
