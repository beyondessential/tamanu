import { createDummyPatient, createDummyVisit } from 'Shared/demoData/patients';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('Visit', () => {
  let patient = null;
  let app = null;
  beforeAll(async () => {
    patient = await models.Patient.create(createDummyPatient());
    app = await baseApp.withPermissions(['readVisit']);
  });

  test.todo('should reject a user with insufficient permissions');
  test.todo('should create an access record');

  it('should get a visit', async () => {
    const v = await models.Visit.create({
      ...createDummyVisit(),
      patientId: patient.id,
    });
    const result = await app.get(`/v1/visit/${v.id}`);
    expect(result).toHaveSucceeded();
    expect(result.body.id).toEqual(v.id);
    expect(result.body.patientId).toEqual(patient.id);
  });

  it('should get a list of visits for a patient', async () => {
    const v = await models.Visit.create({
      ...createDummyVisit(),
      patientId: patient.id,
    });
    const result = await app.get(`/v1/patient/${patient.id}/visits`);
    expect(result).toHaveSucceeded();
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
          ...createDummyVisit(),
          patientId: patient.id,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.id).toBeTruthy();
        const visit = await models.Visit.findByPk(result.body.id);
        expect(visit).toBeDefined();
        expect(visit.patientId).toEqual(patient.id);
      });

      it('should update visit details', async () => {
        const v = await models.Visit.create({
          ...createDummyVisit(),
          patientId: patient.id,
          reasonForVisit: 'before',
        });

        const result = await app.put(`/v1/visit/${v.id}`).send({
          reasonForVisit: 'after',
        });
        expect(result).toHaveSucceeded();

        const updated = await models.Visit.findByPk(v.id);
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

    describe('vitals', () => {
      let vitalsVisit = null;

      beforeAll(async () => {
        vitalsVisit = await models.Visit.create({
          ...createDummyVisit(),
          patientId: patient.id,
          reasonForVisit: 'vitals test',
        });
      });

      it('should record a new vitals reading', async () => {
        const result = await app.post('/v1/vitals').send({
          visitId: vitalsVisit.id,
          heartRate: 1234,
        });
        expect(result).toHaveSucceeded();
        const saved = await models.Vitals.findOne({ where: { heartRate: 1234 } });
        expect(saved).toHaveProperty('heartRate', 1234);
      });

      it('should not record a vitals reading with an invalid visit', async () => {
        const result = await app.post('/v1/vitals').send({
          heartRate: 100,
        });
        expect(result).toHaveRequestError();
      });

      it('should not record a vitals reading with no readings', async () => {
        const result = await app.post('/v1/vitals').send({
          visitId: vitalsVisit.id,
        });
        expect(result).toHaveRequestError();
      });

      it('should get vitals readings for a visit', async () => {
        const result = await app.get(`/v1/visit/${vitalsVisit.id}/vitals`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body).toBeInstanceOf(Array);
      });
    });

    test.todo('should record a note');
    test.todo('should update a note');
  });
});
