import { createDummyPatient, createDummyVisit } from 'shared/demoData/patients';
import { NOTE_OBJECT_TYPES } from 'shared/models/Note';
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

  describe('Visit notes', () => {
    let visit = null;

    beforeAll(async () => {
      visit = await models.Visit.create({
        ...(await createDummyVisit(models)),
        patientId: patient.id,
      });
    });

    it('should attach a note to a visit', async () => {
      const content = chance.paragraph();
      const response = await app.post(`/v1/visit/${visit.id}/notes`).send({
        content,
      });

      expect(response).toHaveSucceeded();

      const note = await models.Note.findByPk(response.body.id);
      expect(note.content).toEqual(content);
      expect(note.objectType).toEqual('Visit');
      expect(note.objectId).toEqual(visit.id);
    });

    it('should edit a note', async () => {
      const note = await models.Note.create({
        content: chance.paragraph(),
        objectId: visit.id,
        objectType: NOTE_OBJECT_TYPES.VISIT,
      });

      const response = await app.put(`/v1/note/${note.id}`).send({
        content: 'updated',
      });

      expect(response).toHaveSucceeded();
      expect(response.body.id).toEqual(note.id);
      expect(response.body.content).toEqual('updated');
    });

    it('should not write a note on an non-existent object', async () => {
      const response = await app.post('/v1/visit/fakeVisitId/notes').send({
        content: chance.paragraph(),
      });

      expect(response).toHaveRequestError();
    });

    describe('permission failures', () => {
      let noPermsApp = null;

      beforeAll(async () => {
        noPermsApp = await baseApp.asRole('base');
      });

      test.todo('should forbid reading notes on a forbidden object');

      it('should forbid writing notes on a forbidden object', async () => {
        const response = await noPermsApp.post(`/v1/visit/${visit.id}/notes`).send({
          content: chance.paragraph(),
        });

        expect(response).toBeForbidden();
      });

      it('should forbid editing notes on a forbidden object', async () => {
        const note = await models.Note.create({
          objectId: visit.id,
          objectType: NOTE_OBJECT_TYPES.VISIT,
          content: chance.paragraph(),
        });

        const response = await noPermsApp.put(`/v1/note/${note.id}`).send({
          content: 'forbidden',
        });

        expect(response).toBeForbidden();
      });
    });
  });
});
