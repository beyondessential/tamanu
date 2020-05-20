import { createDummyPatient, createDummyVisit } from 'shared/demoData/patients';
import moment from 'moment';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('Visit', () => {
  let patient = null;
  let app = null;
  beforeAll(async () => {
    patient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');
  });

  it('should reject reading a visit with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const visit = await models.Visit.create({
      ...(await createDummyVisit(models)),
      patientId: patient.id,
    });

    const result = await noPermsApp.get(`/v1/visit/${visit.id}`);
    expect(result).toBeForbidden();
  });

  test.todo('should create an access record');

  it('should get a visit', async () => {
    const v = await models.Visit.create({
      ...(await createDummyVisit(models)),
      patientId: patient.id,
    });
    const result = await app.get(`/v1/visit/${v.id}`);
    expect(result).toHaveSucceeded();
    expect(result.body.id).toEqual(v.id);
    expect(result.body.patientId).toEqual(patient.id);
  });

  it('should get a list of visits for a patient', async () => {
    const v = await models.Visit.create({
      ...(await createDummyVisit(models)),
      patientId: patient.id,
    });
    const result = await app.get(`/v1/patient/${patient.id}/visits`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toBeGreaterThan(0);
    expect(result.body.data.some(x => x.id === v.id)).toEqual(true);
  });

  it('should fail to get a visit that does not exist', async () => {
    const result = await app.get('/v1/visit/nonexistent');
    expect(result).toHaveRequestError();
  });

  test.todo('should get a list of notes');
  test.todo('should get a list of procedures');
  test.todo('should get a list of lab requests');
  test.todo('should get a list of imaging requests');
  test.todo('should get a list of prescriptions');

  describe('write', () => {
    it('should reject updating a visit with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const visit = await models.Visit.create({
        ...(await createDummyVisit(models)),
        patientId: patient.id,
        reasonForVisit: 'intact',
      });

      const result = await noPermsApp.put(`/v1/visit/${visit.id}`).send({
        reasonForVisit: 'forbidden',
      });
      expect(result).toBeForbidden();

      const after = await models.Visit.findByPk(visit.id);
      expect(after.reasonForVisit).toEqual('intact');
    });

    it('should reject creating a new visit with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post('/v1/visit').send({
        ...(await createDummyVisit(models)),
        patientId: patient.id,
        reasonForVisit: 'should-not-be-created',
      });
      expect(result).toBeForbidden();

      const visits = await models.Visit.findAll({
        where: {
          patientId: patient.id,
          reasonForVisit: 'should-not-be-created',
        },
      });
      expect(visits).toHaveLength(0);
    });

    describe('journey', () => {
      // NB:
      // triage happens in Triage.test.js

      it('should create a new visit', async () => {
        const result = await app.post('/v1/visit').send({
          ...(await createDummyVisit(models)),
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
          ...(await createDummyVisit(models)),
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

      it('should change visit type and add a note', async () => {
        const v = await models.Visit.create({
          ...(await createDummyVisit(models)),
          patientId: patient.id,
          visitType: 'triage',
        });

        const result = await app.put(`/v1/visit/${v.id}`).send({
          visitType: 'admission',
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        const check = x => x.content.includes('triage') && x.content.includes('admission');
        expect(notes.some(check)).toEqual(true);
      });

      it('should fail to change visit type to an invalid type', async () => {
        const v = await models.Visit.create({
          ...(await createDummyVisit(models)),
          patientId: patient.id,
          visitType: 'triage',
        });

        const result = await app.put(`/v1/visit/${v.id}`).send({
          visitType: 'not-a-real-visit-type',
        });
        expect(result).toHaveRequestError();

        const notes = await v.getNotes();
        expect(notes).toHaveLength(0);
      });

      it('should change visit department and add a note', async () => {
        const departments = await models.ReferenceData.findAll({
          where: { type: 'department' },
          limit: 2,
        });

        const v = await models.Visit.create({
          ...(await createDummyVisit(models)),
          patientId: patient.id,
          departmentId: departments[0].id,
        });

        const result = await app.put(`/v1/visit/${v.id}`).send({
          departmentId: departments[1].id,
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        const check = x =>
          x.content.includes(departments[0].name) && x.content.includes(departments[1].name);
        expect(notes.some(check)).toEqual(true);
      });

      it('should change visit location and add a note', async () => {
        const [fromLocation, toLocation] = await models.ReferenceData.findAll({
          where: { type: 'location' },
          limit: 2,
        });

        const v = await models.Visit.create({
          ...(await createDummyVisit(models)),
          patientId: patient.id,
          locationId: fromLocation.id,
        });

        const result = await app.put(`/v1/visit/${v.id}`).send({
          locationId: toLocation.id,
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        const check = x =>
          x.content.includes(fromLocation.name) && x.content.includes(toLocation.name);
        expect(notes.some(check)).toEqual(true);
      });

      it('should discharge a patient', async () => {
        const v = await models.Visit.create({
          ...(await createDummyVisit(models)),
          patientId: patient.id,
          startDate: moment()
            .subtract(4, 'weeks')
            .toDate(),
          endDate: null,
          reasonForVisit: 'before',
        });

        const endDate = new Date();
        const result = await app.put(`/v1/visit/${v.id}`).send({
          endDate,
        });
        expect(result).toHaveSucceeded();

        const updated = await models.Visit.findByPk(v.id);
        expect(updated.endDate).toEqual(endDate);

        const notes = await v.getNotes();
        const check = x => x.content.includes('Discharged');
        expect(notes.some(check)).toEqual(true);
      });

      it('should not update visit to an invalid location or add a note', async () => {
        const v = await models.Visit.create({
          ...(await createDummyVisit(models)),
          patientId: patient.id,
        });

        const result = await app.put(`/v1/visit/${v.id}`).send({
          locationId: 'invalid-location-id',
        });

        expect(result).toHaveRequestError();
      });

      it('should roll back a whole modification if part of it is invalid', async () => {
        // to test this, we're going to do a valid location change and an invalid visit type update

        const [fromLocation, toLocation] = await models.ReferenceData.findAll({
          where: { type: 'location' },
          limit: 2,
        });

        const v = await models.Visit.create({
          ...(await createDummyVisit(models)),
          visitType: 'clinic',
          patientId: patient.id,
          locationId: fromLocation.id,
        });

        const result = await app.put(`/v1/visit/${v.id}`).send({
          locationId: toLocation.id,
          visitType: 'not-a-real-visit-type',
        });
        expect(result).toHaveRequestError();

        const updatedVisit = await models.Visit.findByPk(v.id);
        expect(updatedVisit).toHaveProperty('visitType', 'clinic');
        expect(updatedVisit).toHaveProperty('locationId', fromLocation.id);

        const notes = await v.getNotes();
        expect(notes).toHaveLength(0);
      });

      test.todo('should not admit a patient who is already in a visit');
      test.todo('should not admit a patient who is dead');
    });

    describe('diagnoses', () => {
      let diagnosisVisit = null;
      let testDiagnosis = null;

      beforeAll(async () => {
        diagnosisVisit = await models.Visit.create({
          ...(await createDummyVisit(models)),
          patientId: patient.id,
          reasonForVisit: 'diagnosis test',
        });

        testDiagnosis = await models.ReferenceData.create({
          type: 'icd10',
          name: 'Malady',
          code: 'malady',
        });
      });

      it('should record a diagnosis', async () => {
        const result = await app.post('/v1/diagnosis').send({
          visitId: diagnosisVisit.id,
          diagnosisId: testDiagnosis.id,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.date).toBeTruthy();
      });

      it('should get diagnoses for a visit', async () => {
        const result = await app.get(`/v1/visit/${diagnosisVisit.id}/diagnoses`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].diagnosisId).toEqual(testDiagnosis.id);
      });

      it('should get diagnosis reference info when listing visits', async () => {
        const result = await app.get(`/v1/visit/${diagnosisVisit.id}/diagnoses`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].name).toEqual('Malady');
        expect(body.data[0].code).toEqual('malady');
      });
    });

    describe('vitals', () => {
      let vitalsVisit = null;

      beforeAll(async () => {
        vitalsVisit = await models.Visit.create({
          ...(await createDummyVisit(models)),
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
        expect(body.count).toBeGreaterThan(0);
      });
    });

    test.todo('should record a note');
    test.todo('should update a note');
  });
});
