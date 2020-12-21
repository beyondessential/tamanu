import { createDummyPatient, createDummyEncounter } from 'shared/demoData/patients';
import { NOTE_RECORD_TYPES } from 'shared/models/Note';
import { NOTE_TYPES } from 'shared/constants';
import Chance from 'chance';
import { createTestContext } from '../utilities';

const chance = new Chance();

const { baseApp, models } = createTestContext();

describe('Note', () => {
  let patient = null;
  let app = null;
  beforeAll(async () => {
    patient = await models.Patient.create(await createDummyPatient(models));
    app = await baseApp.asRole('practitioner');
  });

  test.todo('should attach a note to a patient');

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
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        noteType: NOTE_TYPES.SYSTEM,
      });

      expect(response).toHaveSucceeded();

      const note = await models.Note.findByPk(response.body.id);
      expect(note.content).toEqual(content);
      expect(note.recordType).toEqual('Encounter');
      expect(note.recordId).toEqual(encounter.id);
    });

    it('should edit a note', async () => {
      const note = await models.Note.create({
        content: chance.paragraph(),
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        noteType: NOTE_TYPES.SYSTEM,
      });

      const response = await app.put(`/v1/note/${note.id}`).send({
        content: 'updated',
      });

      expect(response).toHaveSucceeded();
      expect(response.body.id).toEqual(note.id);
      expect(response.body.content).toEqual('updated');
    });

    it('should not write a note on an non-existent record', async () => {
      const response = await app.post('/v1/encounter/fakeEncounterId/notes').send({
        content: chance.paragraph(),
        recordId: encounter.id,
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
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
          recordId: encounter.id,
          recordType: NOTE_RECORD_TYPES.ENCOUNTER,
          noteType: NOTE_TYPES.SYSTEM,
        });

        expect(response).toBeForbidden();
      });

      it('should forbid editing notes on a forbidden record', async () => {
        const note = await models.Note.create({
          content: chance.paragraph(),
          recordId: encounter.id,
          recordType: NOTE_RECORD_TYPES.ENCOUNTER,
          noteType: NOTE_TYPES.SYSTEM,
        });

        const response = await noPermsApp.put(`/v1/note/${note.id}`).send({
          content: 'forbidden',
        });

        expect(response).toBeForbidden();
      });
    });
  });
});
