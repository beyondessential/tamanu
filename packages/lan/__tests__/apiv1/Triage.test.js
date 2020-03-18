import Chance from 'chance';
import moment from 'moment';

import { createDummyPatient, randomReferenceId, randomUser } from 'shared/demoData/patients';
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
    practitionerId: await randomUser(models),
    ...overrides,
  };
};

describe('Triage', () => {

  let patient = null;
  let app = null;
  beforeAll(async () => {
    patient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');
  });

  it('should admit a patient to triage', async () => {
    const response = await app.post('/v1/triage').send({
      patientId: patient.id,
      triageReasonId: '',
      practitionerId: '',
      score: 4,
      notes: '123',
    });
    expect(response).toHaveSucceeded();

    const createdTriage = await models.Triage.findByPk(response.body.id);
    expect(createdTriage).toBeTruthy();
    const createdVisit = await models.Visit.findByPk(createdTriage.visitId);
    expect(createdVisit).toBeTruthy();
  });

  test.todo('should fail to triage if a visit is already open');

  // TODO: waiting on visit progression functionality
  test.todo('should close a triage by progressing a visit');

  // TODO: waiting on visit closure
  test.todo('should close a triage by discharging a visit');

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
