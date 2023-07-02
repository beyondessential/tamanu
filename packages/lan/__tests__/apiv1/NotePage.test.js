import {
  createDummyPatient,
  createDummyEncounter,
  randomReferenceId,
} from 'shared/demoData/patients';
import { NOTE_RECORD_TYPES, NOTE_TYPES } from 'shared/constants';
import { chance } from 'shared/test-helpers';
import { createTestContext } from '../utilities';

const randomLabTests = (models, labTestCategoryId, amount) =>
  models.LabTestType.findAll({
    where: {
      labTestCategoryId,
    },
    limit: amount,
  });

describe('Note', () => {
  let patient = null;
  let app = null;
  let baseApp = null;
  let models = null;
  let ctx;
  let testUser;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    patient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');
    testUser = await models.User.create({
      email: 'testemail@something.com',
      displayName: 'display name for the test user',
      password: 'abcdefg123456',
      role: 'practitioner',
    });
  });
  afterAll(() => ctx.close());

  test.todo('should attach a note to a patient');

  describe('LabRequest notes', () => {
    let labRequest = null;

    beforeAll(async () => {
      const categoryId = await randomReferenceId(models, 'labTestCategory');
      const labTestTypeIds = (await randomLabTests(models, categoryId, 2)).map(({ id }) => id);
      labRequest = await app.post('/v1/labRequest').send({
        categoryId,
        displayId: 'TESTID',
        labTestTypeIds,
        patientId: patient.id,
      });
    });

    it('should attach a note to a lab request', async () => {
      const content = chance.paragraph();
      const response = await app.post(`/v1/labRequest/${labRequest.body[0].id}/notes`).send({
        content,
        noteType: NOTE_TYPES.OTHER,
      });

      expect(response).toHaveSucceeded();

      const notePage = await models.NotePage.findOne({
        include: [
          {
            model: models.NoteItem,
            as: 'noteItems',
          },
        ],
        where: { id: response.body.id },
      });
      const noteItem = notePage.noteItems[0];
      expect(noteItem.content).toEqual(content);
      expect(notePage.recordType).toEqual('LabRequest');
      expect(notePage.recordId).toEqual(labRequest.body[0].id);
    });
  });

  describe('Encounter notes', () => {
    let encounter = null;

    beforeAll(async () => {
      encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });
    });

    it('should attach a note to an encounter', async () => {
      const content = chance.paragraph();
      const response = await app.post(`/v1/encounter/${encounter.id}/notes`).send({
        content,
        noteType: NOTE_TYPES.SYSTEM,
      });

      expect(response).toHaveSucceeded();

      const notePage = await models.NotePage.findOne({
        include: [
          {
            model: models.NoteItem,
            as: 'noteItems',
          },
        ],
        where: { id: response.body.id },
      });
      const noteItem = notePage.noteItems[0];

      expect(noteItem.content).toEqual(content);
      expect(notePage.recordType).toEqual('Encounter');
      expect(notePage.recordId).toEqual(encounter.id);
    });

    it('should not write a note on an non-existent record', async () => {
      const response = await app.post('/v1/encounter/fakeEncounterId/notes').send({
        content: chance.paragraph(),
      });

      expect(response).toHaveRequestError();
    });

    describe('permission failures', () => {
      let noPermsApp = null;

      beforeAll(async () => {
        noPermsApp = await baseApp.asRole('base');
      });

      test.todo('should forbid reading notes on a forbidden record');

      it('should forbid writing notes on a forbidden record', async () => {
        const response = await noPermsApp.post(`/v1/encounter/${encounter.id}/notes`).send({
          content: chance.paragraph(),
          noteType: NOTE_TYPES.SYSTEM,
        });

        expect(response).toBeForbidden();
      });

      it('should forbid editing notes on a forbidden record', async () => {
        const notePage = await models.NotePage.createForRecord(
          encounter.id,
          NOTE_RECORD_TYPES.ENCOUNTER,
          NOTE_TYPES.SYSTEM,
          chance.paragraph(),
        );
        await notePage.getNoteItems();

        const response = await noPermsApp.put(`/v1/notePages/${notePage.id}`).send({
          content: 'forbidden',
        });

        expect(response).toBeForbidden();
      });

      it('should forbid editing an encounter note', async () => {
        const note = await models.NotePage.createForRecord(
          encounter.id,
          NOTE_RECORD_TYPES.ENCOUNTER,
          NOTE_TYPES.SYSTEM,
          chance.paragraph(),
          app.user.id,
        );

        const response = await app.put(`/v1/notePages/${note.id}`).send({
          content: 'updated',
        });

        expect(response).toBeForbidden();
      });
    });
  });

  describe('PatientCarePlan notes', () => {
    let patientCarePlan = null;

    beforeAll(async () => {
      patientCarePlan = await models.PatientCarePlan.create({
        patientId: patient.id,
      });
    });

    it('should allow editing a patient care plan note regardless of the author', async () => {
      const notePage = await models.NotePage.createForRecord(
        patientCarePlan.id,
        NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
        NOTE_TYPES.TREATMENT_PLAN,
        chance.paragraph(),
        testUser.id,
      );
      await notePage.getNoteItems();
      const response = await app.put(`/v1/notePages/${notePage.id}`).send({
        content: 'updated',
      });

      expect(response).toHaveSucceeded();
      expect(response.body.id).toEqual(notePage.id);
      expect(response.body.noteItems[0].content).toEqual('updated');
    });
  });
});
