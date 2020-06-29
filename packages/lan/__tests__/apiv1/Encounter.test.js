import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import moment from 'moment';
import { createTestContext } from '../utilities';

const { baseApp, models } = createTestContext();

describe('Encounter', () => {
  let patient = null;
  let app = null;
  beforeAll(async () => {
    patient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');
  });

  it('should reject reading an encounter with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    const result = await noPermsApp.get(`/v1/encounter/${encounter.id}`);
    expect(result).toBeForbidden();
  });

  test.todo('should create an access record');

  it('should get an encounter', async () => {
    const v = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const result = await app.get(`/v1/encounter/${v.id}`);
    expect(result).toHaveSucceeded();
    expect(result.body.id).toEqual(v.id);
    expect(result.body.patientId).toEqual(patient.id);
  });

  it('should get a list of encounters for a patient', async () => {
    const v = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const result = await app.get(`/v1/patient/${patient.id}/encounters`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toBeGreaterThan(0);
    expect(result.body.data.some(x => x.id === v.id)).toEqual(true);
  });

  it('should fail to get an encounter that does not exist', async () => {
    const result = await app.get('/v1/encounter/nonexistent');
    expect(result).toHaveRequestError();
  });

  it('should get a list of notes', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const otherEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    await Promise.all([
      models.Note.createForRecord(encounter, 'Encounter', 'Test 1'),
      models.Note.createForRecord(encounter, 'Encounter', 'Test 2'),
      models.Note.createForRecord(encounter, 'Encounter', 'Test 3'),
      models.Note.createForRecord(otherEncounter, 'Encounter', 'Fail'),
    ]);

    const result = await app.get(`/v1/encounter/${encounter.id}/notes`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(3);
    expect(result.body.data.every(x => x.content.match(/^Test \d$/))).toEqual(true);
  });

  test.todo('should get a list of procedures');
  test.todo('should get a list of lab requests');
  test.todo('should get a list of imaging requests');
  test.todo('should get a list of prescriptions');

  describe('write', () => {
    it('should reject updating an encounter with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
        reasonForEncounter: 'intact',
      });

      const result = await noPermsApp.put(`/v1/encounter/${encounter.id}`).send({
        reasonForEncounter: 'forbidden',
      });
      expect(result).toBeForbidden();

      const after = await models.Encounter.findByPk(encounter.id);
      expect(after.reasonForEncounter).toEqual('intact');
    });

    it('should reject creating a new encounter with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post('/v1/encounter').send({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
        reasonForEncounter: 'should-not-be-created',
      });
      expect(result).toBeForbidden();

      const encounters = await models.Encounter.findAll({
        where: {
          patientId: patient.id,
          reasonForEncounter: 'should-not-be-created',
        },
      });
      expect(encounters).toHaveLength(0);
    });

    describe('journey', () => {
      // NB:
      // triage happens in Triage.test.js

      it('should create a new encounter', async () => {
        const result = await app.post('/v1/encounter').send({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.id).toBeTruthy();
        const encounter = await models.Encounter.findByPk(result.body.id);
        expect(encounter).toBeDefined();
        expect(encounter.patientId).toEqual(patient.id);
      });

      it('should update encounter details', async () => {
        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          reasonForEncounter: 'before',
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          reasonForEncounter: 'after',
        });
        expect(result).toHaveSucceeded();

        const updated = await models.Encounter.findByPk(v.id);
        expect(updated.reasonForEncounter).toEqual('after');
      });

      it('should change encounter type and add a note', async () => {
        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          encounterType: 'triage',
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          encounterType: 'admission',
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        const check = x => x.content.includes('triage') && x.content.includes('admission');
        expect(notes.some(check)).toEqual(true);
      });

      it('should fail to change encounter type to an invalid type', async () => {
        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          encounterType: 'triage',
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          encounterType: 'not-a-real-encounter-type',
        });
        expect(result).toHaveRequestError();

        const notes = await v.getNotes();
        expect(notes).toHaveLength(0);
      });

      it('should change encounter department and add a note', async () => {
        const departments = await models.ReferenceData.findAll({
          where: { type: 'department' },
          limit: 2,
        });

        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          departmentId: departments[0].id,
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          departmentId: departments[1].id,
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        const check = x =>
          x.content.includes(departments[0].name) && x.content.includes(departments[1].name);
        expect(notes.some(check)).toEqual(true);
      });

      it('should change encounter location and add a note', async () => {
        const [fromLocation, toLocation] = await models.ReferenceData.findAll({
          where: { type: 'location' },
          limit: 2,
        });

        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          locationId: fromLocation.id,
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          locationId: toLocation.id,
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        const check = x =>
          x.content.includes(fromLocation.name) && x.content.includes(toLocation.name);
        expect(notes.some(check)).toEqual(true);
      });

      it('should discharge a patient', async () => {
        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          startDate: moment()
            .subtract(4, 'weeks')
            .toDate(),
          endDate: null,
          reasonForEncounter: 'before',
        });

        const endDate = new Date();
        const result = await app.put(`/v1/encounter/${v.id}`).send({
          endDate,
        });
        expect(result).toHaveSucceeded();

        const updated = await models.Encounter.findByPk(v.id);
        expect(updated.endDate).toEqual(endDate);

        const notes = await v.getNotes();
        const check = x => x.content.includes('Discharged');
        expect(notes.some(check)).toEqual(true);
      });

      it('should not update encounter to an invalid location or add a note', async () => {
        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          locationId: 'invalid-location-id',
        });

        expect(result).toHaveRequestError();
      });

      it('should roll back a whole modification if part of it is invalid', async () => {
        // to test this, we're going to do a valid location change and an invalid encounter type update

        const [fromLocation, toLocation] = await models.ReferenceData.findAll({
          where: { type: 'location' },
          limit: 2,
        });

        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          encounterType: 'clinic',
          patientId: patient.id,
          locationId: fromLocation.id,
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          locationId: toLocation.id,
          encounterType: 'not-a-real-encounter-type',
        });
        expect(result).toHaveRequestError();

        const updatedEncounter = await models.Encounter.findByPk(v.id);
        expect(updatedEncounter).toHaveProperty('encounterType', 'clinic');
        expect(updatedEncounter).toHaveProperty('locationId', fromLocation.id);

        const notes = await v.getNotes();
        expect(notes).toHaveLength(0);
      });

      test.todo('should not admit a patient who is already in an encounter');
      test.todo('should not admit a patient who is dead');
    });

    describe('diagnoses', () => {
      let diagnosisEncounter = null;
      let testDiagnosis = null;

      beforeAll(async () => {
        diagnosisEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          reasonForEncounter: 'diagnosis test',
        });

        testDiagnosis = await models.ReferenceData.create({
          type: 'icd10',
          name: 'Malady',
          code: 'malady',
        });
      });

      it('should record a diagnosis', async () => {
        const result = await app.post('/v1/diagnosis').send({
          encounterId: diagnosisEncounter.id,
          diagnosisId: testDiagnosis.id,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.date).toBeTruthy();
      });

      it('should get diagnoses for an encounter', async () => {
        const result = await app.get(`/v1/encounter/${diagnosisEncounter.id}/diagnoses`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].diagnosisId).toEqual(testDiagnosis.id);
      });

      it('should get diagnosis reference info when listing encounters', async () => {
        const result = await app.get(`/v1/encounter/${diagnosisEncounter.id}/diagnoses`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].diagnosis.name).toEqual('Malady');
        expect(body.data[0].diagnosis.code).toEqual('malady');
      });
    });

    describe('medication', () => {
      let medicationEncounter = null;
      let testMedication = null;

      beforeAll(async () => {
        medicationEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          reasonForEncounter: 'medication test',
        });

        testMedication = await models.ReferenceData.create({
          type: 'drug',
          name: 'Checkizol',
          code: 'check',
        });
      });

      it('should record a medication', async () => {
        const result = await app.post('/v1/medication').send({
          encounterId: medicationEncounter.id,
          medicationId: testMedication.id,
          prescriberId: app.user.id,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.date).toBeTruthy();
      });

      it('should get medications for an encounter', async () => {
        const result = await app.get(`/v1/encounter/${medicationEncounter.id}/medications`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].medicationId).toEqual(testMedication.id);
      });

      it('should get medication reference info when listing encounters', async () => {
        const result = await app.get(`/v1/encounter/${medicationEncounter.id}/medications`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].medication.name).toEqual('Checkizol');
        expect(body.data[0].medication.code).toEqual('check');
      });
    });

    describe('vitals', () => {
      let vitalsEncounter = null;

      beforeAll(async () => {
        vitalsEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          reasonForEncounter: 'vitals test',
        });
      });

      it('should record a new vitals reading', async () => {
        const result = await app.post('/v1/vitals').send({
          encounterId: vitalsEncounter.id,
          heartRate: 1234,
        });
        expect(result).toHaveSucceeded();
        const saved = await models.Vitals.findOne({ where: { heartRate: 1234 } });
        expect(saved).toHaveProperty('heartRate', 1234);
      });

      it('should not record a vitals reading with an invalid encounter', async () => {
        const result = await app.post('/v1/vitals').send({
          heartRate: 100,
        });
        expect(result).toHaveRequestError();
      });

      it('should not record a vitals reading with no readings', async () => {
        const result = await app.post('/v1/vitals').send({
          encounterId: vitalsEncounter.id,
        });
        expect(result).toHaveRequestError();
      });

      it('should get vitals readings for an encounter', async () => {
        const result = await app.get(`/v1/encounter/${vitalsEncounter.id}/vitals`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
      });
    });

    test.todo('should record a note');
    test.todo('should update a note');
  });
});
