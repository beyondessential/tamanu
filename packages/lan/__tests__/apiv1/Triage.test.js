import Chance from 'chance';

import { createDummyPatient } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

const chance = new Chance();

const createDummyTriage = () => ({
  score: chance.integer({ min: 1, max: 5 }),
  notes: chance.sentence(),
  triageReasonId: // get reason from list,
  practitionerId: // get user from list,
  arrivalTime: // some random time ago,
  triageTime: // same as arrival,
  closedTime: // needs to discern between generating open and closed triages
});

describe('Triage', () => {

  let patient = null;
  let app = null;
  beforeAll(async () => {
    patient = await models.Patient.create(createDummyPatient());
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
