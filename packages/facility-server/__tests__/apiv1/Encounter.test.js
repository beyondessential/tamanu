import { addHours, formatISO9075, sub, subWeeks } from 'date-fns';
import config from 'config';

import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import {
  DOCUMENT_SOURCES,
  EncounterChangeType,
  IMAGING_REQUEST_STATUS_TYPES,
  NOTE_RECORD_TYPES,
  NOTE_TYPES,
  VITALS_DATA_ELEMENT_IDS,
} from '@tamanu/constants';
import { setupSurveyFromObject } from '@tamanu/database/demoData/surveys';
import { fake, fakeUser } from '@tamanu/fake-data/fake';
import { getCurrentDateTimeString, toDateTimeString } from '@tamanu/utils/dateTime';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { uploadAttachment } from '../../dist/utils/uploadAttachment';
import { createTestContext } from '../utilities';
import { setupSurvey } from '../setupSurvey';

describe('Encounter', () => {
  const [facilityId] = selectFacilityIds(config);
  let patient = null;
  let user = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    user = await models.User.create({ ...fakeUser(), role: 'practitioner' });
    app = await baseApp.asUser(user);
  });
  afterAll(() => ctx.close());

  it('should reject reading an encounter with insufficient permissions', async () => {
    const noPermsApp = await baseApp.asRole('base');
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    const result = await noPermsApp.get(`/api/encounter/${encounter.id}`);
    expect(result).toBeForbidden();
  });

  test.todo('should create an access record');

  it('should get an encounter', async () => {
    const v = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const result = await app.get(`/api/encounter/${v.id}`);
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

    const result = await app.get(`/api/patient/${patient.id}/encounters`);
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
    const result = await app.get('/api/encounter/nonexistent');
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

    const result = await app.get(`/api/encounter/${encounter.id}/discharge`);

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

  it('should get a list of notes and pin treatment plan notes to the top', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    const otherEncounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });
    await Promise.all([
      models.Note.createForRecord(
        encounter.id,
        'Encounter',
        NOTE_TYPES.AREA_TO_BE_IMAGED,
        'Test 1',
      ),
      models.Note.createForRecord(encounter.id, 'Encounter', NOTE_TYPES.TREATMENT_PLAN, 'Test 2'),
      models.Note.createForRecord(encounter.id, 'Encounter', NOTE_TYPES.OTHER, 'Test 3'),
      models.Note.createForRecord(
        otherEncounter.id,
        'Encounter',
        NOTE_TYPES.TREATMENT_PLAN,
        'Fail',
      ),
    ]);

    const result = await app.get(`/api/encounter/${encounter.id}/notes`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(3);
    expect(result.body.data.every(x => x.content.match(/^Test \d$/))).toEqual(true);
    expect(result.body.data[0].noteTypeId).toEqual(NOTE_TYPES.TREATMENT_PLAN);
  });

  it('should get a list of notes filtered by noteTypeId', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    await Promise.all([
      models.Note.createForRecord(encounter.id, 'Encounter', NOTE_TYPES.TREATMENT_PLAN, 'Test 4'),
      models.Note.createForRecord(encounter.id, 'Encounter', NOTE_TYPES.TREATMENT_PLAN, 'Test 5'),
      models.Note.createForRecord(encounter.id, 'Encounter', NOTE_TYPES.OTHER, 'Test 6'),
    ]);

    const result = await app.get(
      `/api/encounter/${encounter.id}/notes?noteTypeId=${NOTE_TYPES.TREATMENT_PLAN}`,
    );
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(2);
    expect(result.body.data.every(x => x.noteTypeId === NOTE_TYPES.TREATMENT_PLAN)).toEqual(true);
  });

  it('should get a list of changelog notes of a root note ordered DESC', async () => {
    const encounter = await models.Encounter.create({
      ...(await createDummyEncounter(models)),
      patientId: patient.id,
    });

    const rootNote = await models.Note.create(
      fake(models.Note, {
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        content: 'Root note',
        authorId: app.user.id,
        date: toDateTimeString(sub(new Date(), { days: 8 })),
      }),
    );
    const changelog1 = await models.Note.create(
      fake(models.Note, {
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        content: 'Changelog1',
        authorId: app.user.id,
        date: toDateTimeString(sub(new Date(), { days: 6 })),
        revisedById: rootNote.id,
      }),
    );
    const changelog2 = await models.Note.create(
      fake(models.Note, {
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        content: 'Changelog2',
        authorId: app.user.id,
        date: toDateTimeString(sub(new Date(), { days: 4 })),
        revisedById: rootNote.id,
      }),
    );

    const changelog3 = await models.Note.create(
      fake(models.Note, {
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        content: 'Changelog3',
        authorId: app.user.id,
        date: toDateTimeString(sub(new Date(), { days: 2 })),
        revisedById: rootNote.id,
      }),
    );

    const result = await app.get(`/api/encounter/${encounter.id}/notes/${rootNote.id}/changelogs`);
    expect(result).toHaveSucceeded();
    expect(result.body.count).toEqual(4);
    expect(result.body.data[0]).toMatchObject({
      recordId: changelog3.recordId,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      content: changelog3.content,
      authorId: changelog3.authorId,
      date: changelog3.date,
      revisedById: rootNote.id,
    });
    expect(result.body.data[1]).toMatchObject({
      recordId: changelog2.recordId,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      content: changelog2.content,
      authorId: changelog2.authorId,
      date: changelog2.date,
      revisedById: rootNote.id,
    });
    expect(result.body.data[2]).toMatchObject({
      recordId: changelog1.recordId,
      recordType: NOTE_RECORD_TYPES.ENCOUNTER,
      content: changelog1.content,
      authorId: changelog1.authorId,
      date: changelog1.date,
      revisedById: rootNote.id,
    });
  });

  test.todo('should get a list of procedures');
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

    const result = await app.get(`/api/encounter/${encounter.id}/documentMetadata`);
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
      `/api/encounter/${encounter.id}/documentMetadata?order=asc&orderBy=name`,
    );
    expect(resultAsc).toHaveSucceeded();
    expect(resultAsc.body.data[0].id).toBe(metadataOne.id);

    const resultDesc = await app.get(
      `/api/encounter/${encounter.id}/documentMetadata?order=desc&orderBy=name`,
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
      `/api/encounter/${encounter.id}/documentMetadata?page=1&rowsPerPage=10&offset=5`,
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

      const result = await noPermsApp.put(`/api/encounter/${encounter.id}`).send({
        reasonForEncounter: 'forbidden',
      });
      expect(result).toBeForbidden();

      const after = await models.Encounter.findByPk(encounter.id);
      expect(after.reasonForEncounter).toEqual('intact');
    });

    it('should reject creating a new encounter with insufficient permissions', async () => {
      const noPermsApp = await baseApp.asRole('base');
      const result = await noPermsApp.post('/api/encounter').send({
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
        const result = await app.post('/api/encounter').send({
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

        const result = await app.post('/api/encounter').send({
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

        const result = await app.put(`/api/encounter/${v.id}`).send({
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

        const result = await app.put(`/api/encounter/${v.id}`).send({
          encounterType: 'admission',
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        expect(notes).toHaveLength(1);
        expect(
          notes[0].content.includes('Triage') && notes[0].content.includes('Admission'),
        ).toEqual(true);
        expect(notes[0].authorId).toEqual(app.user.id);
      });

      it('should fail to change encounter type to an invalid type', async () => {
        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          encounterType: 'triage',
        });

        const result = await app.put(`/api/encounter/${v.id}`).send({
          encounterType: 'not-a-real-encounter-type',
        });
        expect(result).toHaveRequestError();

        const notes = await v.getNotes();
        expect(notes).toHaveLength(0);
      });

      it('should change encounter department and add a note', async () => {
        const departments = await models.Department.findAll({ limit: 2 });

        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          departmentId: departments[0].id,
        });

        const result = await app.put(`/api/encounter/${v.id}`).send({
          departmentId: departments[1].id,
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        expect(notes).toHaveLength(1);
        expect(
          notes[0].content.includes(departments[0].name) &&
            notes[0].content.includes(departments[1].name),
        ).toEqual(true);
        expect(notes[0].authorId).toEqual(app.user.id);
      });

      it('should change encounter location and add a note', async () => {
        const [fromLocation, toLocation] = await models.Location.findAll({ limit: 2 });

        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          locationId: fromLocation.id,
        });

        const result = await app.put(`/api/encounter/${v.id}`).send({
          locationId: toLocation.id,
        });
        expect(result).toHaveSucceeded();

        const notes = await v.getNotes();
        expect(notes).toHaveLength(1);
        expect(
          notes[0].content.includes(fromLocation.name) &&
            notes[0].content.includes(toLocation.name),
        ).toEqual(true);
        expect(notes[0].authorId).toEqual(app.user.id);
      });

      it('should include comma separated location_group and location name in created note on updating encounter location', async () => {
        const facility = await models.Facility.create(fake(models.Facility));
        const locationGroup = await models.LocationGroup.create({
          ...fake(models.LocationGroup),
          facilityId: facility.id,
        });
        const locationGroup2 = await models.LocationGroup.create({
          ...fake(models.LocationGroup),
          facilityId: facility.id,
        });
        const location = await models.Location.create({
          ...fake(models.Location),
          locationGroupId: locationGroup.id,
          facilityId: facility.id,
        });
        const location2 = await models.Location.create({
          ...fake(models.Location),
          locationGroupId: locationGroup2.id,
          facilityId: facility.id,
        });
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          locationId: location.id,
        });
        const result = await app.put(`/api/encounter/${encounter.id}`).send({
          locationId: location2.id,
        });

        const [notes] = await encounter.getNotes();

        expect(result).toHaveSucceeded();
        expect(notes.content).toEqual(
          `• Changed location from ‘${locationGroup.name}, ${location.name}’ to ‘${locationGroup2.name}, ${location2.name}’`,
        );
      });

      it('should change encounter clinician and add a note', async () => {
        const fromClinician = await models.User.create(fakeUser());
        const toClinician = await models.User.create(fakeUser());

        const existingEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          examinerId: fromClinician.id,
        });

        const result = await app.put(`/api/encounter/${existingEncounter.id}`).send({
          examinerId: toClinician.id,
        });
        expect(result).toHaveSucceeded();

        const updatedEncounter = await models.Encounter.findOne({
          where: { id: existingEncounter.id },
        });
        expect(updatedEncounter.examinerId).toEqual(toClinician.id);

        const notes = await existingEncounter.getNotes();
        expect(notes).toHaveLength(1);
        expect(notes[0].content).toEqual(
          `• Changed supervising clinician from ‘${fromClinician.displayName}’ to ‘${toClinician.displayName}’`,
        );
        expect(notes[0].authorId).toEqual(app.user.id);
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

        const result = await app.put(`/api/encounter/${v.id}`).send({
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

        const notes = await v.getNotes();
        expect(notes).toHaveLength(1);
        expect(notes[0].content.includes('Patient discharged by')).toEqual(true);
        expect(notes[0].authorId).toEqual(app.user.id);
      });

      it('should not update encounter to an invalid location or add a note', async () => {
        const v = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
        });

        const result = await app.put(`/api/encounter/${v.id}`).send({
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

        const result = await app.put(`/api/encounter/${v.id}`).send({
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
          type: 'diagnosis',
          name: 'Malady',
          code: 'malady',
        });
      });

      it('should record a diagnosis', async () => {
        const result = await app.post('/api/diagnosis').send({
          encounterId: diagnosisEncounter.id,
          diagnosisId: testDiagnosis.id,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.date).toBeTruthy();
      });

      it('should get diagnoses for an encounter', async () => {
        const result = await app.get(`/api/encounter/${diagnosisEncounter.id}/diagnoses`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].diagnosisId).toEqual(testDiagnosis.id);
      });

      it('should get diagnosis reference info when listing encounters', async () => {
        const result = await app.get(`/api/encounter/${diagnosisEncounter.id}/diagnoses`);
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
          ...(await createDummyEncounter(models, { current: true })),
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
        const result = await app
          .post(`/api/medication/encounterPrescription/${medicationEncounter.id}`)
          .send({
            medicationId: testMedication.id,
            prescriberId: app.user.id,
            doseAmount: 1,
            units: '%',
            frequency: 'Immediately',
            route: 'dermal',
            date: '2025-01-01',
            startDate: getCurrentDateTimeString(),
          });
        expect(result).toHaveSucceeded();
        expect(result.body.date).toBeTruthy();
      });

      it('should create a medication set successfully', async () => {
        const secondMedication = await models.ReferenceData.create({
          type: 'drug',
          name: 'TestDrug2',
          code: 'test2',
        });

        const result = await app.post('/api/medication/medication-set').send({
          encounterId: medicationEncounter.id,
          medicationSet: [
            {
              medicationId: secondMedication.id,
              prescriberId: app.user.id,
              doseAmount: 2,
              units: 'mg',
              frequency: 'Immediately',
              route: 'oral',
              date: '2025-01-01',
              startDate: getCurrentDateTimeString(),
            },
          ],
        });
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveLength(1);
        expect(result.body[0].medicationId).toEqual(secondMedication.id);
      });

      it('should import ongoing medications successfully', async () => {
        const ongoingPrescription1 = await models.Prescription.create({
          medicationId: testMedication.id,
          prescriberId: app.user.id,
          doseAmount: 1,
          units: '%',
          frequency: 'Immediately',
          route: 'dermal',
          date: '2025-01-01',
          startDate: getCurrentDateTimeString(),
          isOngoing: true,
        });

        const secondMedication = await models.ReferenceData.create({
          type: 'drug',
          name: 'TestDrug2',
          code: 'test2',
        });

        const ongoingPrescription2 = await models.Prescription.create({
          medicationId: secondMedication.id,
          prescriberId: app.user.id,
          doseAmount: 2,
          units: 'mg',
          frequency: 'Immediately',
          route: 'oral',
          date: '2025-01-01',
          startDate: getCurrentDateTimeString(),
          isOngoing: true,
        });

        await models.PatientOngoingPrescription.bulkCreate([
          {
            patientId: patient.id,
            prescriptionId: ongoingPrescription1.id,
          },
          {
            patientId: patient.id,
            prescriptionId: ongoingPrescription2.id,
          },
        ]);

        const result = await app.post('/api/medication/import-ongoing').send({
          encounterId: medicationEncounter.id,
          prescriptionIds: [ongoingPrescription1.id, ongoingPrescription2.id],
          prescriberId: app.user.id,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.count).toEqual(2);
        expect(result.body.data).toHaveLength(2);
        expect(result.body.data[0].medicationId).toEqual(testMedication.id);
        expect(result.body.data[1].medicationId).toEqual(secondMedication.id);
      });

      it('should get medications for an encounter', async () => {
        const result = await app.get(`/api/encounter/${medicationEncounter.id}/medications`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].medicationId).toEqual(testMedication.id);
      });

      it('should get medication reference info when listing encounters', async () => {
        const result = await app.get(`/api/encounter/${medicationEncounter.id}/medications`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.count).toBeGreaterThan(0);
        expect(body.data[0].medication.name).toEqual('Checkizol');
        expect(body.data[0].medication.code).toEqual('check');
      });

      it('should reject creating medication when encounter is discharged', async () => {
        // Discharge the encounter first
        const endDate = getCurrentDateTimeString();
        await app.put(`/api/encounter/${medicationEncounter.id}`).send({
          endDate,
          discharge: {
            dischargerId: app.user.id,
          },
        });

        const result = await app
          .post(`/api/medication/encounterPrescription/${medicationEncounter.id}`)
          .send({
            medicationId: testMedication.id,
            prescriberId: app.user.id,
            doseAmount: 1,
            units: '%',
            frequency: 'Immediately',
            route: 'dermal',
            date: '2025-01-01',
            startDate: getCurrentDateTimeString(),
          });
        expect(result).toHaveRequestError();
        expect(result.body.error.message).toContain('is discharged');
      });

      it('should reject creating medication set when encounter is discharged', async () => {
        const result = await app.post('/api/medication/medication-set').send({
          encounterId: medicationEncounter.id,
          medicationSet: [
            {
              medicationId: testMedication.id,
              prescriberId: app.user.id,
              doseAmount: 1,
              units: '%',
              frequency: 'Immediately',
              route: 'dermal',
              date: '2025-01-01',
              startDate: getCurrentDateTimeString(),
            },
          ],
        });
        expect(result).toHaveRequestError();
        expect(result.body.error.message).toContain('is discharged');
      });

      it('should reject importing ongoing medications when encounter is discharged', async () => {
        const ongoingPrescription = await models.Prescription.create({
          medicationId: testMedication.id,
          prescriberId: app.user.id,
          doseAmount: 1,
          units: '%',
          frequency: 'Immediately',
          route: 'dermal',
          date: '2025-01-01',
          startDate: getCurrentDateTimeString(),
          isOngoing: true,
        });

        await models.PatientOngoingPrescription.create({
          patientId: patient.id,
          prescriptionId: ongoingPrescription.id,
        });

        const result = await app.post('/api/medication/import-ongoing').send({
          encounterId: medicationEncounter.id,
          prescriptionIds: [ongoingPrescription.id],
          prescriberId: app.user.id,
        });
        expect(result).toHaveRequestError();
        expect(result.body.error.message).toContain('is discharged');
      });
    });

    describe('pharmacyOrder', () => {
      let pharmacyOrderEncounter = null;
      let testPrescription = null;

      beforeAll(async () => {
        pharmacyOrderEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          reasonForEncounter: 'medication test',
        });

        const testMedication = await models.ReferenceData.create({
          type: 'drug',
          name: 'Checkizol',
          code: 'check',
        });

        testPrescription = await models.Prescription.create(
          fake(models.Prescription, {
            patientId: patient.id,
            prescriberId: app.user.id,
            medicationId: testMedication.id,
          }),
        );

        await models.EncounterPrescription.create({
          encounterId: pharmacyOrderEncounter.id,
          prescriptionId: testPrescription.id,
        });
      });

      afterEach(async () => {
        await models.PharmacyOrderPrescription.truncate({ cascade: true, force: true });
        await models.PharmacyOrder.truncate({ cascade: true, force: true });
      });

      it('should record a pharmacy order', async () => {
        const comments = 'test comments';
        const result = await app
          .post(`/api/encounter/${pharmacyOrderEncounter.id}/pharmacyOrder`)
          .send({
            orderingClinicianId: app.user.id,
            comments,
            isDischargePrescription: true,
            pharmacyOrderPrescriptions: [
              {
                prescriptionId: testPrescription.id,
                quantity: 1,
                repeats: 1,
              },
            ],
          });
        expect(result).toHaveSucceeded();
        expect(result.body.id).toBeTruthy();
        expect(result.body.comments).toBe(comments);
        expect(result.body.isDischargePrescription).toBe(true);
        expect(result.body.orderingClinicianId).toBe(app.user.id);
        const pharmacyOrderId = result.body.id;
        const pharmacyOrderPrescriptions = await models.PharmacyOrderPrescription.findAll({
          where: { pharmacyOrderId },
        });
        expect(pharmacyOrderPrescriptions).toHaveLength(1);
        expect(pharmacyOrderPrescriptions[0].prescriptionId).toBe(testPrescription.id);
        expect(pharmacyOrderPrescriptions[0].quantity).toBe(1);
        expect(pharmacyOrderPrescriptions[0].repeats).toBe(1);
      });

      it('should return the last ordered timestamp of the medication has been ordered', async () => {
        const fakeCreatedAt = new Date('2020-01-01T00:00:00.000Z');
        const pharmacyOrder = await app
          .post(`/api/encounter/${pharmacyOrderEncounter.id}/pharmacyOrder`)
          .send({
            orderingClinicianId: app.user.id,
            comments: 'comments',
            pharmacyOrderPrescriptions: [
              {
                prescriptionId: testPrescription.id,
                quantity: 1,
                repeats: 1,
              },
            ],
          });

        await models.PharmacyOrderPrescription.update(
          { createdAt: fakeCreatedAt },
          { where: { pharmacyOrderId: pharmacyOrder.body.id } },
        );

        const result = await app.get(`/api/encounter/${pharmacyOrderEncounter.id}/medications`);
        expect(result).toHaveSucceeded();
        const { body } = result;
        expect(body.data[0].lastOrderedAt).toEqual(fakeCreatedAt.toISOString());
      });
    });

    describe('vitals', () => {
      let vitalsEncounter = null;
      let vitalsPatient = null;

      beforeAll(async () => {
        // The original patient may or may not have a current encounter
        // So let's create a specific one for vitals testing
        vitalsPatient = await models.Patient.create(await createDummyPatient(models));
        vitalsEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models, { endDate: null })),
          patientId: vitalsPatient.id,
          reasonForEncounter: 'vitals test',
        });

        await setupSurveyFromObject(models, {
          program: {
            id: 'vitals-program',
          },
          survey: {
            id: 'vitals-survey',
            survey_type: 'vitals',
          },
          questions: [
            {
              name: 'PatientVitalsDate',
              type: 'Date',
            },
            {
              name: 'PatientVitalsWeight',
              type: 'Number',
            },
            {
              name: 'PatientVitalsHeight',
              type: 'Number',
            },
            {
              name: 'PatientVitalsHeartRate',
              type: 'Number',
            },
            {
              name: 'PatientVitalsSBP',
              type: 'Number',
            },
          ],
        });
      });

      describe('basic vital features', () => {
        beforeEach(async () => {
          await models.VitalLog.truncate({});
          await models.SurveyResponseAnswer.truncate({});
          await models.SurveyResponse.truncate({});
        });
        it('should record a new vitals reading', async () => {
          const submissionDate = getCurrentDateTimeString();
          const result = await app.post('/api/surveyResponse').send({
            surveyId: 'vitals-survey',
            patientId: vitalsPatient.id,
            startTime: submissionDate,
            endTime: submissionDate,
            answers: {
              'pde-PatientVitalsDate': submissionDate,
              'pde-PatientVitalsHeartRate': 1234,
            },
            facilityId,
          });
          expect(result).toHaveSucceeded();
          const saved = await models.SurveyResponseAnswer.findOne({
            where: { dataElementId: 'pde-PatientVitalsHeartRate', body: '1234' },
          });
          expect(saved).toHaveProperty('body', '1234');
        });

        it('should get vitals readings for an encounter', async () => {
          const submissionDate = getCurrentDateTimeString();
          const answers = {
            'pde-PatientVitalsDate': submissionDate,
            'pde-PatientVitalsHeartRate': 123,
            'pde-PatientVitalsHeight': 456,
            'pde-PatientVitalsWeight': 789,
          };
          await app.post('/api/surveyResponse').send({
            surveyId: 'vitals-survey',
            patientId: vitalsPatient.id,
            startTime: submissionDate,
            endTime: submissionDate,
            answers,
            facilityId,
          });
          const result = await app.get(`/api/encounter/${vitalsEncounter.id}/vitals`);
          expect(result).toHaveSucceeded();
          const { body } = result;
          expect(body).toHaveProperty('count');
          expect(body.count).toBeGreaterThan(0);
          expect(body).toHaveProperty('data');
          expect(body.data).toEqual(
            expect.arrayContaining(
              Object.entries(answers).map(([key, value]) =>
                expect.objectContaining({
                  dataElementId: key,
                  records: {
                    [submissionDate]: expect.objectContaining({
                      id: expect.any(String),
                      body: value.toString(),
                      logs: null,
                    }),
                  },
                }),
              ),
            ),
          );
        });
      });

      describe('vitals data by data element id', () => {
        const nullAnswer = {
          responseId: 'response_id_5',
          submissionDate: formatISO9075(addHours(new Date(), -5)),
          value: 'null', // null value exist on the databases for historical reasons
        };
        const answers = [
          {
            responseId: 'response_id_1',
            submissionDate: formatISO9075(addHours(new Date(), -1)),
            value: 122,
          },
          {
            responseId: 'response_id_2',
            submissionDate: formatISO9075(addHours(new Date(), -3)),
            value: 155,
          },
          {
            responseId: 'response_id_3',
            submissionDate: formatISO9075(addHours(new Date(), -2)),
            value: 133,
          },
          {
            responseId: 'response_id_4',
            submissionDate: formatISO9075(addHours(new Date(), -4)),
            value: '',
          },
          nullAnswer,
        ];
        const patientVitalSbpKey = VITALS_DATA_ELEMENT_IDS.sbp;

        beforeAll(async () => {
          for (const answer of answers) {
            const { submissionDate, value, responseId } = answer;
            const surveyResponseAnswersBody = {
              'pde-PatientVitalsDate': submissionDate,
              [patientVitalSbpKey]: value,
            };
            await app.post('/api/surveyResponse').send({
              id: responseId,
              surveyId: 'vitals-survey',
              patientId: vitalsPatient.id,
              startTime: submissionDate,
              endTime: submissionDate,
              answers: surveyResponseAnswersBody,
              facilityId,
            });
          }

          // Can't import null value by endpoint as it is prevented, so we have to update it manually
          await models.SurveyResponseAnswer.update(
            { body: null },
            {
              where: {
                response_id: nullAnswer.responseId,
                data_element_id: patientVitalSbpKey,
              },
            },
          );
        });

        afterAll(async () => {
          for (const answer of answers) {
            await models.SurveyResponseAnswer.destroy({
              where: {
                response_id: answer.responseId,
              },
            });
            await models.SurveyResponse.destroy({
              where: {
                id: answer.responseId,
              },
            });
          }
        });

        it('should get vital data within time frame and filter out empty and null value', async () => {
          const startDateString = formatISO9075(addHours(new Date(), -4));
          const endDateString = formatISO9075(new Date());
          const expectedAnswers = answers.filter(
            answer => answer.value !== '' && answer.value !== nullAnswer.value,
          );

          const result = await app.get(
            `/api/encounter/${vitalsEncounter.id}/graphData/vitals/${patientVitalSbpKey}?startDate=${startDateString}&endDate=${endDateString}`,
          );
          expect(result).toHaveSucceeded();
          const { body } = result;
          expect(body).toHaveProperty('count');
          expect(body.count).toEqual(expectedAnswers.length);
          expect(body).toHaveProperty('data');
          expect(body.data).toEqual(
            expect.arrayContaining(
              expectedAnswers.map(answer =>
                expect.objectContaining({
                  dataElementId: patientVitalSbpKey,
                  body: answer.value.toString(),
                  recordedDate: answer.submissionDate,
                }),
              ),
            ),
          );

          const expectedRecordedDate = [...expectedAnswers]
            .sort((a, b) => (a.submissionDate > b.submissionDate ? 1 : -1))
            .map(answer => answer.submissionDate);
          const resultRecordedDate = body.data.map(data => data.recordedDate);
          expect(resultRecordedDate).toEqual(expectedRecordedDate);
        });

        it('should get vital data on the edge of time frame (equal to startdate)', async () => {
          const startDateString = answers[0].submissionDate;
          const endDateString = formatISO9075(new Date());
          const result = await app.get(
            `/api/encounter/${vitalsEncounter.id}/graphData/vitals/${patientVitalSbpKey}?startDate=${startDateString}&endDate=${endDateString}`,
          );
          expect(result).toHaveSucceeded();
          const { body } = result;
          expect(body).toHaveProperty('count');
          expect(body.count).toEqual(1);
          expect(body).toHaveProperty('data');
          expect(body.data).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                dataElementId: patientVitalSbpKey,
                body: answers[0].value.toString(),
                recordedDate: answers[0].submissionDate,
              }),
            ]),
          );
        });
      });
    });

    describe('program responses', () => {
      disableHardcodedPermissionsForSuite();

      let surveyEncounter = null;
      let permissionApp;

      beforeAll(async () => {
        surveyEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          reasonForEncounter: 'medication test',
        });
      });

      it('should only return survey responses that users have permission to', async () => {
        const { patient, survey: survey1 } = await setupSurvey({
          models,
          surveyName: 'survey-a',
          encounterId: surveyEncounter.id,
        });

        const { survey: survey2 } = await setupSurvey({
          models,
          surveyName: 'survey-b',
          patientId: patient.id,
          encounterId: surveyEncounter.id,
        });
        await setupSurvey({
          models,
          surveyName: 'survey-c',
          patientId: patient.id,
          encounterId: surveyEncounter.id,
        });

        const permissions = [
          ['read', 'Patient'],
          ['list', 'SurveyResponse'],
          ['read', 'Survey', survey1.id],
          ['read', 'Survey', survey2.id],
          // No survey 2
        ];

        permissionApp = await baseApp.asNewRole(permissions);

        const response = await permissionApp.get(`/api/patient/${patient.id}/programResponses`);
        expect(response).toHaveSucceeded();
        expect(response.body.count).toEqual(2);
        expect(response.body.data).toHaveLength(2);
      });
    });

    describe('document metadata', () => {
      it('should fail creating a document metadata if the encounter ID does not exist', async () => {
        const result = await app.post('/api/encounter/123456789/documentMetadata').send({
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

        const result = await app.post(`/api/encounter/${encounter.id}/documentMetadata`).send({
          name: 'test document',
          type: 'application/pdf',
          source: DOCUMENT_SOURCES.PATIENT_LETTER,
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

    describe('imaging request', () => {
      it('should get a list of imaging requests', async () => {
        // arrange
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
        });

        const imagingRequest = await models.ImagingRequest.create(
          fake(models.ImagingRequest, {
            patientId: patient.id,
            encounterId: encounter.id,
            requestedById: app.user.id,
            status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
          }),
        );

        const areaRefData = await models.ReferenceData.create(
          fake(models.ReferenceData, { type: 'xRayImagingArea' }),
        );

        const area = await models.ImagingRequestArea.create(
          fake(models.ImagingRequestArea, {
            areaId: areaRefData.id,
            imagingRequestId: imagingRequest.id,
          }),
        );

        // act
        const result = await app.get(
          `/api/encounter/${encodeURIComponent(encounter.id)}/imagingRequests`,
        );

        // assert
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          count: 1,
          data: expect.any(Array),
        });
        const resultLabReq = result.body.data[0];
        expect(resultLabReq.areas).toEqual([
          expect.objectContaining({
            id: areaRefData.id,
            ImagingRequestArea: expect.objectContaining({ id: area.id }),
          }),
        ]);
      });

      it('should get a list of imaging requests ordered by joined column', async () => {
        // arrange

        const practictionerB = await models.User.create({ ...fakeUser(), displayName: 'B' });
        const practictionerA = await models.User.create({ ...fakeUser(), displayName: 'A' });
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
        });

        const imagingRequestB = await models.ImagingRequest.create(
          fake(models.ImagingRequest, {
            patientId: patient.id,
            encounterId: encounter.id,
            requestedById: practictionerB.id,
            status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
          }),
        );

        const imagingRequestA = await models.ImagingRequest.create(
          fake(models.ImagingRequest, {
            patientId: patient.id,
            encounterId: encounter.id,
            requestedById: practictionerA.id,
            status: IMAGING_REQUEST_STATUS_TYPES.PENDING,
          }),
        );

        // act
        const result = await app.get(
          `/api/encounter/${encodeURIComponent(
            encounter.id,
          )}/imagingRequests?orderBy=requestedBy.displayName&order=asc`,
        );

        // assert
        expect(result).toHaveSucceeded();
        expect(result.body).toMatchObject({
          count: 2,
          data: [
            expect.objectContaining({ id: imagingRequestA.id }),
            expect.objectContaining({ id: imagingRequestB.id }),
          ],
        });
      });
    });

    describe('encounter history', () => {
      describe('single change', () => {
        it('should record an encounter history when an encounter is created', async () => {
          const result = await app.post('/api/encounter').send({
            ...(await createDummyEncounter(models)),
            patientId: patient.id,
          });

          expect(result).toHaveSucceeded();
          const encounter = await models.Encounter.findByPk(result.body.id);

          const encounterHistoryRecords = await models.EncounterHistory.findAll({
            where: {
              encounterId: encounter.id,
            },
          });

          expect(encounterHistoryRecords).toHaveLength(1);
          expect(encounterHistoryRecords[0]).toMatchObject({
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: encounter.locationId,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            date: encounter.startDate,
          });
        });

        it('should record an encounter history for a location change', async () => {
          const [oldLocation, newLocation] = await models.Location.findAll({ limit: 2 });
          const submittedTime = getCurrentDateTimeString();
          const result = await app.post('/api/encounter').send({
            ...(await createDummyEncounter(models)),
            patientId: patient.id,
            locationId: oldLocation.id,
          });

          expect(result).toHaveSucceeded();
          const encounter = await models.Encounter.findByPk(result.body.id);

          const updateResult = await app.put(`/api/encounter/${encounter.id}`).send({
            locationId: newLocation.id,
            submittedTime,
          });

          expect(updateResult).toHaveSucceeded();

          const encounterHistoryRecords = await models.EncounterHistory.findAll({
            where: {
              encounterId: encounter.id,
            },
          });

          expect(encounterHistoryRecords).toHaveLength(2);
          expect(encounterHistoryRecords[0]).toMatchObject({
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: oldLocation.id,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            date: encounter.startDate,
          });

          expect(encounterHistoryRecords[1]).toMatchObject({
            date: submittedTime,
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: newLocation.id,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            changeType: [EncounterChangeType.Location],
            actorId: user.id,
          });
        });

        it('should record an encounter history for a department change', async () => {
          const [oldDepartment, newDepartment] = await models.Department.findAll({ limit: 2 });
          const submittedTime = getCurrentDateTimeString();
          const result = await app.post('/api/encounter').send({
            ...(await createDummyEncounter(models)),
            patientId: patient.id,
            departmentId: oldDepartment.id,
          });

          expect(result).toHaveSucceeded();
          const encounter = await models.Encounter.findByPk(result.body.id);

          const updateResult = await app.put(`/api/encounter/${encounter.id}`).send({
            departmentId: newDepartment.id,
            submittedTime,
          });

          expect(updateResult).toHaveSucceeded();

          const encounterHistoryRecords = await models.EncounterHistory.findAll({
            where: {
              encounterId: encounter.id,
            },
          });

          expect(encounterHistoryRecords).toHaveLength(2);
          expect(encounterHistoryRecords[0]).toMatchObject({
            encounterId: encounter.id,
            departmentId: oldDepartment.id,
            locationId: encounter.locationId,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            date: encounter.startDate,
          });
          expect(encounterHistoryRecords[1]).toMatchObject({
            date: submittedTime,
            encounterId: encounter.id,
            departmentId: newDepartment.id,
            locationId: encounter.locationId,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            changeType: [EncounterChangeType.Department],
            actorId: user.id,
          });
        });

        it('should record an encounter history for a clinician change', async () => {
          const [oldClinician, newClinician] = await models.User.findAll({ limit: 2 });
          const submittedTime = getCurrentDateTimeString();

          const result = await app.post('/api/encounter').send({
            ...(await createDummyEncounter(models)),
            patientId: patient.id,
            examinerId: oldClinician.id,
          });

          expect(result).toHaveSucceeded();
          const encounter = await models.Encounter.findByPk(result.body.id);

          const updateResult = await app.put(`/api/encounter/${encounter.id}`).send({
            examinerId: newClinician.id,
            submittedTime,
          });

          expect(updateResult).toHaveSucceeded();

          const encounterHistoryRecords = await models.EncounterHistory.findAll({
            where: {
              encounterId: encounter.id,
            },
          });

          expect(encounterHistoryRecords).toHaveLength(2);
          expect(encounterHistoryRecords[0]).toMatchObject({
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: encounter.locationId,
            examinerId: oldClinician.id,
            encounterType: encounter.encounterType,
            actorId: user.id,
            date: encounter.startDate,
          });
          expect(encounterHistoryRecords[1]).toMatchObject({
            date: submittedTime,
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: encounter.locationId,
            examinerId: newClinician.id,
            encounterType: encounter.encounterType,
            changeType: [EncounterChangeType.Examiner],
            actorId: user.id,
          });
        });

        it('should record an encounter history for an encounter type change', async () => {
          const oldEncounterType = 'admission';
          const newEncounterType = 'clinic';
          const submittedTime = getCurrentDateTimeString();

          const result = await app.post('/api/encounter').send({
            ...(await createDummyEncounter(models)),
            patientId: patient.id,
            encounterType: oldEncounterType,
          });

          expect(result).toHaveSucceeded();
          const encounter = await models.Encounter.findByPk(result.body.id);

          const updateResult = await app.put(`/api/encounter/${encounter.id}`).send({
            encounterType: newEncounterType,
            submittedTime,
          });

          expect(updateResult).toHaveSucceeded();

          const encounterHistoryRecords = await models.EncounterHistory.findAll({
            where: {
              encounterId: encounter.id,
            },
          });

          expect(encounterHistoryRecords).toHaveLength(2);
          expect(encounterHistoryRecords[0]).toMatchObject({
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: encounter.locationId,
            examinerId: encounter.examinerId,
            encounterType: oldEncounterType,
            actorId: user.id,
            date: encounter.startDate,
          });
          expect(encounterHistoryRecords[1]).toMatchObject({
            date: submittedTime,
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: encounter.locationId,
            examinerId: encounter.examinerId,
            encounterType: newEncounterType,
            changeType: [EncounterChangeType.EncounterType],
            actorId: user.id,
          });
        });
      });

      describe('multiple changes', () => {
        it('should record an encounter history for mixed changes', async () => {
          const [oldLocation, newLocation] = await models.Location.findAll({ limit: 2 });
          const [oldDepartment, newDepartment] = await models.Department.findAll({ limit: 2 });
          const [oldClinician, newClinician] = await models.User.findAll({ limit: 2 });

          const result = await app.post('/api/encounter').send({
            ...(await createDummyEncounter(models)),
            patientId: patient.id,
            examinerId: oldClinician.id,
            locationId: oldLocation.id,
            departmentId: oldDepartment.id,
          });

          expect(result).toHaveSucceeded();
          const encounter = await models.Encounter.findByPk(result.body.id);

          const locationChangeSubmittedTime = getCurrentDateTimeString();

          const updateResult = await app.put(`/api/encounter/${encounter.id}`).send({
            locationId: newLocation.id,
            submittedTime: locationChangeSubmittedTime,
          });
          expect(updateResult).toHaveSucceeded();

          let encounterHistoryRecords = await models.EncounterHistory.findAll({
            where: {
              encounterId: encounter.id,
            },
            order: [['date', 'ASC']],
          });

          expect(encounterHistoryRecords).toHaveLength(2);
          expect(encounterHistoryRecords[0]).toMatchObject({
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: oldLocation.id,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            date: encounter.startDate,
          });
          expect(encounterHistoryRecords[1]).toMatchObject({
            date: locationChangeSubmittedTime,
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: newLocation.id,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
          });

          const departmentChangeSubmittedTime = getCurrentDateTimeString();
          const updateResult2 = await app.put(`/api/encounter/${encounter.id}`).send({
            departmentId: newDepartment.id,
            submittedTime: departmentChangeSubmittedTime,
          });

          expect(updateResult2).toHaveSucceeded();

          encounterHistoryRecords = await models.EncounterHistory.findAll({
            where: {
              encounterId: encounter.id,
            },
            order: [['date', 'ASC']],
          });

          expect(encounterHistoryRecords).toHaveLength(3);
          expect(encounterHistoryRecords[0]).toMatchObject({
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: encounter.locationId,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            date: encounter.startDate,
          });
          expect(encounterHistoryRecords[1]).toMatchObject({
            date: locationChangeSubmittedTime,
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: newLocation.id,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            changeType: [EncounterChangeType.Location],
          });
          expect(encounterHistoryRecords[2]).toMatchObject({
            date: departmentChangeSubmittedTime,
            encounterId: encounter.id,
            departmentId: newDepartment.id,
            locationId: newLocation.id,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            changeType: [EncounterChangeType.Department],
          });

          const clinicianChangeSubmittedTime = getCurrentDateTimeString();
          const updateResult3 = await app.put(`/api/encounter/${encounter.id}`).send({
            examinerId: newClinician.id,
            submittedTime: clinicianChangeSubmittedTime,
          });

          expect(updateResult3).toHaveSucceeded();

          encounterHistoryRecords = await models.EncounterHistory.findAll({
            where: {
              encounterId: encounter.id,
            },
            order: [['date', 'ASC']],
          });

          expect(encounterHistoryRecords).toHaveLength(4);
          expect(encounterHistoryRecords[0]).toMatchObject({
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: encounter.locationId,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            date: encounter.startDate,
          });
          expect(encounterHistoryRecords[1]).toMatchObject({
            date: locationChangeSubmittedTime,
            encounterId: encounter.id,
            departmentId: encounter.departmentId,
            locationId: newLocation.id,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            changeType: [EncounterChangeType.Location],
          });
          expect(encounterHistoryRecords[2]).toMatchObject({
            date: departmentChangeSubmittedTime,
            encounterId: encounter.id,
            departmentId: newDepartment.id,
            locationId: newLocation.id,
            examinerId: encounter.examinerId,
            encounterType: encounter.encounterType,
            actorId: user.id,
            changeType: [EncounterChangeType.Department],
          });
          expect(encounterHistoryRecords[3]).toMatchObject({
            date: clinicianChangeSubmittedTime,
            encounterId: encounter.id,
            departmentId: newDepartment.id,
            locationId: newLocation.id,
            examinerId: newClinician.id,
            encounterType: encounter.encounterType,
            actorId: user.id,
            changeType: [EncounterChangeType.Examiner],
          });
        });
      });
    });

    test.todo('should record a note');
    test.todo('should update a note');

    describe('Planned location move', () => {
      it('Adding a planned location should also add a planned location time', async () => {
        const [location, plannedLocation] = await models.Location.findAll({ limit: 2 });
        const submittedTime = getCurrentDateTimeString();
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          locationId: location.id,
        });

        const result = await app.put(`/api/encounter/${encounter.id}`).send({
          plannedLocationId: plannedLocation.id,
          submittedTime,
        });
        expect(result).toHaveSucceeded();

        const updatedEncounter = await models.Encounter.findByPk(encounter.id);
        expect(updatedEncounter.plannedLocationId).toEqual(plannedLocation.id);
        expect(updatedEncounter.plannedLocationStartTime).toEqual(submittedTime);
      });
      it('Clearing a planned location should also clear the planned location time', async () => {
        const [location, plannedLocation] = await models.Location.findAll({ limit: 2 });
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          locationId: location.id,
          plannedLocationId: plannedLocation.id,
          submittedTime: getCurrentDateTimeString(),
        });

        const result = await app.put(`/api/encounter/${encounter.id}`).send({
          plannedLocationId: null,
        });
        expect(result).toHaveSucceeded();

        const updatedEncounter = await models.Encounter.findByPk(encounter.id);
        expect(updatedEncounter.plannedLocationId).toBe(null);
        expect(updatedEncounter.plannedLocationStartTime).toBe(null);
      });
      it('Updating the location should also clear the planned location info', async () => {
        const [location, plannedLocation] = await models.Location.findAll({ limit: 2 });
        const encounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
          locationId: location.id,
          plannedLocationId: plannedLocation.id,
          submittedTime: getCurrentDateTimeString(),
        });

        const result = await app.put(`/api/encounter/${encounter.id}`).send({
          locationId: plannedLocation.id,
        });
        expect(result).toHaveSucceeded();

        const updatedEncounter = await models.Encounter.findByPk(encounter.id);
        expect(updatedEncounter.locationId).toEqual(plannedLocation.id);
        expect(updatedEncounter.plannedLocationId).toBe(null);
        expect(updatedEncounter.plannedLocationStartTime).toBe(null);
      });
    });
  });
});
