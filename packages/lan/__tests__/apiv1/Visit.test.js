import { getTestContext } from '../utilities';

const app = getTestContext();

describe('Visit', () => {

  let patient = null;
  beforeAll(async () => {
    const result = await app.post('/v1/patient').send({
      firstName: 'Test',
      lastName: 'Patient',
      displayId: 'XQXQXQ',
      sex: 'male',
    });
    patient = result.body;
  });

  test.todo('should reject a user with insufficient permissions');
  test.todo('should create an access record');

  it('should get a visit', async () => {
    const v = await app.models.Visit.create({
      visitType: 'clinic',
      patientId: patient.id,   
      startDate: '2020-01-02',
    });
    const result = await app.get(`/v1/visit/${v.id}`);
    expect(result).not.toHaveRequestError();
    expect(result.body.id).toEqual(v.id);
    expect(result.body.patientId).toEqual(patient.id);
  });

  it('should get a list of visits for a patient', async () => {
    const v = await app.models.Visit.create({
      visitType: 'clinic',
      patientId: patient.id,   
      startDate: '2020-01-02',
    });
    const result = await app.get(`/v1/patient/${patient.id}/visits`);
    expect(result).not.toHaveRequestError();
    expect(result.body).toBeInstanceOf(Array);
    expect(result.body.some(x => x.id === v.id)).toEqual(true);
  });

  it('should fail to get a visit that does not exist', async () => {
    const result = await app.get('/v1/visit/nonexistent');
    expect(result).toHaveRequestError();
  });

  test.todo('should get a list of diagnoses');
  test.todo('should get a list of vitals readings');
  test.todo('should get a list of notes');
  test.todo('should get a list of procedures');
  test.todo('should get a list of lab requests');
  test.todo('should get a list of imaging requests');
  test.todo('should get a list of prescriptions');

  describe('write', () => {
    test.todo('should reject a user with insufficient permissions');

    describe('journey', () => {
      // NB:
      // triage happens in Triage.test.js
      
      it('should create a new visit', async () => {
        const result = await app.post('/v1/visit').send({
          patientId: patient.id,
          visitType: 'clinic',
          startDate: '2020-01-1',
        });
        expect(result).not.toHaveRequestError();
        expect(result.body.id).toBeTruthy();
        const visit = await app.models.Visit.findByPk(result.body.id);
        expect(visit).toBeDefined();
        expect(visit.patientId).toEqual(patient.id);
      });

      it('should update visit details', async () => {
        const v = await app.models.Visit.create({
          visitType: 'clinic',
          patientId: patient.id,   
          startDate: '2020-01-02',
          reasonForVisit: 'before',
        });

        const result = await app.put(`/v1/visit/${v.id}`).send({
          reasonForVisit: 'after',
        });
        expect(result).not.toHaveRequestError();

        const updated = await app.models.Visit.findByPk(v.id);
        expect(updated.reasonForVisit).toEqual('after');
      });

      test.todo('should change visit department');
      test.todo('should change visit location');
      test.todo('should discharge a patient');

      test.todo('should not admit a patient who is already in a visit');
      test.todo('should not admit a patient who is dead');
    });

    test.todo('should record a diagnosis');
    test.todo('should update a diagnosis');
    test.todo('should record a vitals reading');
    test.todo('should update a vitals reading');
    test.todo('should record a note');
    test.todo('should update a note');
  });
});
