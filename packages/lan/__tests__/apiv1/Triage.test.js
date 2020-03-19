import Chance from 'chance';
import moment from 'moment';

import { createDummyPatient, createDummyVisit, randomReferenceId, randomUser } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

const chance = new Chance();

const createDummyTriage = async (models, overrides) => {
  const arrivalTime = moment().subtract(chance.integer({ min: 2, max: 80 }), 'minutes').toDate();
  return {
    score: chance.integer({ min: 1, max: 5 }),
    notes: chance.sentence(),
    arrivalTime,
    triageTime: arrivalTime,
    closedTime: null,
    triageReasonId: await randomReferenceId(models, 'triageReason'),
    locationId: await randomReferenceId(models, 'location'),
    departmentId: await randomReferenceId(models, 'department'),
    practitionerId: await randomUser(models),
    ...overrides,
  };
};

describe('Triage', () => {

  let patient = null;
  let app = null;
  beforeAll(async () => {
    app = await baseApp.asRole('practitioner');
  });

  it('should admit a patient to triage', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const response = await app.post('/v1/triage').send(await createDummyTriage(models, {
      patientId: visitPatient.id,
    }));
    expect(response).toHaveSucceeded();

    const createdTriage = await models.Triage.findByPk(response.body.id);
    expect(createdTriage).toBeTruthy();
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();
  });

  it('should fail to triage if a visit is already open', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const visit = await models.Visit.create(await createDummyVisit(models, {
      current: true,
      patientId: visitPatient.id,
    }));
  
    expect(visit.endDate).toBeFalsy();

    const response = await app.post('/v1/triage').send(await createDummyTriage(models, {
      patientId: visitPatient.id,
    }));
    expect(response).toHaveRequestError();
  });

  it('should successfully triage if the existing visit is closed', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const visit = await models.Visit.create(await createDummyVisit(models, {
      current: false,
      patientId: visitPatient.id,
    }));
  
    expect(visit.endDate).toBeTruthy();

    const response = await app.post('/v1/triage').send(await createDummyTriage(models, {
      patientId: visitPatient.id,
    }));
    expect(response).toHaveSucceeded();
  });

  xit('should close a triage by progressing a visit', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(await createDummyTriage(models, {
      patientId: visitPatient.id,
    }));
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();

    const progressResponse = await app.put(`/v1/visit/${createdVisit.id}`).send({
      visitType: VISIT_TYPES.EMERGENCY,
    });
    expect(progressResponse).toHaveSucceeded();
    const updatedTriage = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage.closedTime).toBeTruthy();
  });

  xit('should close a triage by discharging a visit', async () => {
    const visitPatient = await models.Patient.create(await createDummyPatient(models));
    const createdTriage = await models.Triage.create(await createDummyTriage(models, {
      patientId: visitPatient.id,
    }));
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();

    const progressResponse = await app.put(`/v1/visit/${createdVisit.id}`).send({
      endDate: Date.now(),
    });
    expect(progressResponse).toHaveSucceeded();
    const updatedTriage = await models.Triage.findByPk(createdTriage.id);
    expect(updatedTriage.closedTime).toBeTruthy();
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
