import {
  createDummyPatient,
  createDummyEncounter,
  createDummyEncounterMedication,
} from 'shared/demoData/patients';
import { fakeUser } from 'shared/test-helpers/fake';
import { toDateTimeString, getCurrentDateTimeString } from 'shared/utils/dateTime';
import { subWeeks } from 'date-fns';
import { uploadAttachment } from '../../app/utils/uploadAttachment';
import { createTestContext } from '../utilities';

describe('Encounter', () => {
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');
  });
  afterAll(() => ctx.close());

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
    const c = await models.Encounter.create({
      ...(await createDummyEncounter(models, { current: true })),
      patientId: patient.id,
    });

    const result = await app.get(`/v1/patient/${patient.id}/encounters`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toBeGreaterThan(0);
    expect(result.body.data.some(x => x.id === v.id)).toEqual(true);
    expect(result.body.data.some(x => x.id === c.id)).toEqual(true);

    expect(result.body.data.find(x => x.id === v.id)).toMatchObject({
      id: v.id,
      endDate: expect.any(String),
    });
    expect(result.body.data.find(x => x.id === c.id)).toMatchObject({
      id: c.id,
    });
    expect(result.body.data.find(x => x.id === c.id)).not.toHaveProperty('endDate');
  });

  it('should fail to get an encounter that does not exist', async () => {
    const result = await app.get('/v1/encounter/nonexistent');
    expect(result).toHaveRequestError();
  });

  it('should get a discharge', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const { id: dischargeId } = await models.Discharge.create({
      encounterId: encounter.id,
      dischargerId: app.user.id,
    });

    const result = await app.get(`/v1/encounter/${encounter.id}/discharge`);

    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      id: dischargeId,
      encounterId: encounter.id,
      dischargerId: app.user.id,
      discharger: {
        id: app.user.id,
      },
    });
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
      models.NotePage.createForRecord(encounter.id, 'Encounter', 'treatmentPlan', 'Test 1'),
      models.NotePage.createForRecord(encounter.id, 'Encounter', 'treatmentPlan', 'Test 2'),
      models.NotePage.createForRecord(encounter.id, 'Encounter', 'treatmentPlan', 'Test 3'),
      models.NotePage.createForRecord(otherEncounter.id, 'Encounter', 'treatmentPlan', 'Fail'),
    ]);

    const result = await app.get(`/v1/encounter/${encounter.id}/notePages`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(3);
    expect(result.body.data.every(x => x.noteItems[0].content.match(/^Test \d$/))).toEqual(true);
  });

  test.todo('should get a list of procedures');
  test.todo('should get a list of lab requests');
  test.todo('should get a list of imaging requests');
  test.todo('should get a list of prescriptions');

  it('should get a list of all documents from an encounter', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const otherEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    // Create four document metadata objects: two from requested encounter,
    // one from a different encounter, one from the same patient.
    const metadataOne = {
      name: 'one',
      type: 'application/pdf',
      attachmentId: 'fake-id-1',
      encounterId: encounter.id,
    };
    const metadataTwo = {
      name: 'two',
      type: 'application/pdf',
      attachmentId: 'fake-id-2',
      encounterId: encounter.id,
    };
    const metadataThree = {
      name: 'three',
      type: 'application/pdf',
      attachmentId: 'fake-id-3',
      encounterId: otherEncounter.id,
    };
    const metadataFour = {
      name: 'four',
      type: 'application/pdf',
      attachmentId: 'fake-id-4',
      patientId: patient.id,
    };

    await Promise.all([
      models.DocumentMetadata.create(metadataOne),
      models.DocumentMetadata.create(metadataTwo),
      models.DocumentMetadata.create(metadataThree),
      models.DocumentMetadata.create(metadataFour),
    ]);

    const result = await app.get(`/v1/encounter/${encounter.id}/documentMetadata`);
    expect(result).toHaveSucceeded();
    expect(result.body).toMatchObject({
      count: 2,
      data: expect.any(Array),
    });
  });

  it('should get a sorted list of documents', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const metadataOne = await models.DocumentMetadata.create({
      name: 'A',
      type: 'application/pdf',
      attachmentId: 'fake-id-1',
      encounterId: encounter.id,
    });
    const metadataTwo = await models.DocumentMetadata.create({
      name: 'B',
      type: 'image/jpeg',
      attachmentId: 'fake-id-2',
      encounterId: encounter.id,
    });

    // Sort by name ASC/DESC (presumably sufficient to test only one field)
    const resultAsc = await app.get(
      `/v1/encounter/${encounter.id}/documentMetadata?order=asc&orderBy=name`,
    );
    expect(resultAsc).toHaveSucceeded();
    expect(resultAsc.body.data[0].id).toBe(metadataOne.id);

    const resultDesc = await app.get(
      `/v1/encounter/${encounter.id}/documentMetadata?order=desc&orderBy=name`,
    );
    expect(resultDesc).toHaveSucceeded();
    expect(resultDesc.body.data[0].id).toBe(metadataTwo.id);
  });

  it('should get a paginated list of documents', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    const documents = [];
    for (let i = 0; i < 12; i++) {
      documents.push({
        name: String(i),
        type: 'application/pdf',
        attachmentId: `fake-id-${i}`,
        encounterId: encounter.id,
      });
    }
    await models.DocumentMetadata.bulkCreate(documents);
    const result = await app.get(
      `/v1/encounter/${encounter.id}/documentMetadata?page=1&rowsPerPage=10&offset=5`,
    );
    expect(result).toHaveSucceeded();
    expect(result.body.data.length).toBe(7);
  });

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

      it('should record referralSourceId when create a new encounter', async () => {
        const referralSource = await models.ReferenceData.create({
          id: 'test-referral-source-id',
          type: 'referralSource',
          code: 'test-referral-source-id',
          name: 'Test referral source',
        });

        const result = await app.post('/v1/encounter').send({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          referralSourceId: referralSource.id,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.id).toBeTruthy();
        const encounter = await models.Encounter.findByPk(result.body.id);
        expect(encounter).toBeDefined();
        expect(encounter.referralSourceId).toEqual(referralSource.id);
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

        const notePages = await v.getNotePages();
        const noteItems = (await Promise.all(notePages.map(np => np.getNoteItems()))).flat();
        const check = x => x.content.includes('triage') && x.content.includes('admission');
        expect(noteItems.some(check)).toEqual(true);
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

        const notePages = await v.getNotePages();
        expect(notePages).toHaveLength(0);
      });

      it('should change encounter department and add a note', async () => {
        const departments = await models.Department.findAll({ limit: 2 });

        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          departmentId: departments[0].id,
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          departmentId: departments[1].id,
        });
        expect(result).toHaveSucceeded();

        const notePages = await v.getNotePages();
        const noteItems = (await Promise.all(notePages.map(np => np.getNoteItems()))).flat();
        const check = x =>
          x.content.includes(departments[0].name) && x.content.includes(departments[1].name);
        expect(noteItems.some(check)).toEqual(true);
      });

      it('should change encounter location and add a note', async () => {
        const [fromLocation, toLocation] = await models.Location.findAll({ limit: 2 });

        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          locationId: fromLocation.id,
        });

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          locationId: toLocation.id,
        });
        expect(result).toHaveSucceeded();

        const notePages = await v.getNotePages();
        const noteItems = (await Promise.all(notePages.map(np => np.getNoteItems()))).flat();
        const check = x =>
          x.content.includes(fromLocation.name) && x.content.includes(toLocation.name);
        expect(noteItems.some(check)).toEqual(true);
      });

      it('should change encounter clinician and add a note', async () => {
        const fromClinician = await models.User.create(fakeUser());
        const toClinician = await models.User.create(fakeUser());

        const existingEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          examinerId: fromClinician.id,
        });

        const result = await app.put(`/v1/encounter/${existingEncounter.id}`).send({
          examinerId: toClinician.id,
        });
        expect(result).toHaveSucceeded();

        const updatedEncounter = await models.Encounter.findOne({
          where: { id: existingEncounter.id },
        });
        expect(updatedEncounter.examinerId).toEqual(toClinician.id);

        const notePages = await existingEncounter.getNotePages();
        const noteItems = (await Promise.all(notePages.map(np => np.getNoteItems()))).flat();
        expect(noteItems[0].content).toEqual(
          `Changed supervising clinician from ${fromClinician.displayName} to ${toClinician.displayName}`,
        );
      });

      it('should discharge a patient', async () => {
        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          startDate: toDateTimeString(subWeeks(new Date(), 4)),
          endDate: null,
          reasonForEncounter: 'before',
        });
        const endDate = getCurrentDateTimeString();

        const result = await app.put(`/v1/encounter/${v.id}`).send({
          endDate,
          discharge: {
            encounterId: v.id,
            dischargerId: app.user.id,
          },
        });
        expect(result).toHaveSucceeded();

        const updated = await models.Encounter.findByPk(v.id);
        expect(updated.endDate).toEqual(endDate);

        const discharges = await models.Discharge.findAll({
          where: { encounterId: v.id },
        });
        // Discharges have a 1-1 relationship with encounters
        expect(discharges).toHaveLength(1);
        expect(discharges[0]).toMatchObject({
          encounterId: v.id,
          dischargerId: app.user.id,
        });

        const notePages = await v.getNotePages();
        const noteItems = (await Promise.all(notePages.map(np => np.getNoteItems()))).flat();
        const check = x => x.content.includes('Discharged');
        expect(noteItems.some(check)).toEqual(true);
      });

      it('should only update medications marked for discharge', async () => {
        // Create encounter to be discharged
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models, { current: true })),
          patientId: patient.id,
        });

        // Create two encounter medications with specific quantities to compare
        const medicationOne = await models.EncounterMedication.create({
          ...(await createDummyEncounterMedication(models, { quantity: 1 })),
          encounterId: encounter.id,
        });
        const medicationTwo = await models.EncounterMedication.create({
          ...(await createDummyEncounterMedication(models, { quantity: 2 })),
          encounterId: encounter.id,
        });

        // Mark only one medication for discharge
        const result = await app.put(`/v1/encounter/${encounter.id}`).send({
          endDate: new Date(),
          discharge: {
            encounterId: encounter.id,
            dischargerId: app.user.id,
          },
          medications: {
            [medicationOne.id]: {
              isDischarge: true,
              quantity: 3,
              repeats: 0,
            },
            [medicationTwo.id]: {
              isDischarge: false,
              quantity: 0,
              repeats: 1,
            },
          },
        });
        expect(result).toHaveSucceeded();

        // Reload medications and make sure only the first one got edited
        await Promise.all([medicationOne.reload(), medicationTwo.reload()]);

        // Only compare explicitly set values
        expect(medicationOne.dataValues).toMatchObject({
          id: medicationOne.id,
          isDischarge: true,
          quantity: 3,
          repeats: 0,
        });
        expect(medicationTwo.dataValues).toMatchObject({
          id: medicationTwo.id,
          quantity: 2,
        });
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

        const [fromLocation, toLocation] = await models.Location.findAll({ limit: 2 });

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

        const notePages = await v.getNotePages();
        expect(notePages).toHaveLength(0);
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

      it('should get vitals readings for an encounter', async () => {
        const result = await app.get(`/v1/encounter/${vitalsEncounter.id}/vitals`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
      });
    });

    describe('document metadata', () => {
      it('should fail creating a document metadata if the encounter ID does not exist', async () => {
        const result = await app.post('/v1/encounter/123456789/documentMetadata').send({
          name: 'test document',
          documentOwner: 'someone',
          note: 'some note',
        });
        expect(result).toHaveRequestError();
      });

      it('should create a document metadata', async () => {
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
        });

        // Mock function gets called inside api route
        uploadAttachment.mockImplementationOnce(req => ({
          metadata: { ...req.body },
          type: 'application/pdf',
          attachmentId: '123456789',
        }));

        const result = await app.post(`/v1/encounter/${encounter.id}/documentMetadata`).send({
          name: 'test document',
          type: 'application/pdf',
          documentOwner: 'someone',
          note: 'some note',
        });
        expect(result).toHaveSucceeded();
        expect(result.body.id).toBeTruthy();
        const metadata = await models.DocumentMetadata.findByPk(result.body.id);
        expect(metadata).toBeDefined();
        expect(uploadAttachment.mock.calls.length).toBe(1);
      });
    });

    test.todo('should record a note');
    test.todo('should update a note');
  });
});
