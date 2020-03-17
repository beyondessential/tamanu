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

  it('should attach a note to a patient', async () => {
    const content = chance.paragraph();
    const response = await app.post('/v1/note').send({
      objectId: patient.id,
      objectType: NOTE_OBJECT_TYPES.PATIENT,
      content,
    });

    expect(response).toHaveSucceeded();

    const note = await models.Note.findByPk(response.body.id);
    expect(note.content).toEqual(content);
    expect(note.objectType).toEqual('Patient');
    expect(note.objectId).toEqual(patient.id);
  });

  test.todo('should attach a note to a visit');

  it('should edit a note', async () => {
    const note = await models.Note.create({
      content: chance.paragraph(),
      objectId: patient.id,
      objectType: NOTE_OBJECT_TYPES.PATIENT,
    });

    const response = await app.put(`/v1/note/${note.id}`).send({
      content: 'updated',
    });

    expect(response).toHaveSucceeded();
    expect(response.body.id).toEqual(note.id);
    expect(response.body.content).toEqual('updated');
  });

  test.todo('should get all notes on a patient');
  test.todo('should get all notes on a visit');

  it('should not write a note on an invalid object type', async () => {
    const response = await app.post('/v1/note').send({
      objectId: patient.id,
      objectType: 'invalid',
      content: chance.paragraph(),
    });

    expect(response).toHaveRequestError();
  });

  it('should not write a note on an non-existent object', async () => {
    const response = await app.post('/v1/note').send({
      objectId: 'invalid',
      objectType: NOTE_OBJECT_TYPES.PATIENT,
      content: chance.paragraph(),
    });

    expect(response).toHaveRequestError();
  });

  describe('permission failures', () => {
    let forbiddenObject = null;
    let noPermsApp = null;

    beforeAll(async () => {
      forbiddenObject = await models.Patient.create(await createDummyPatient(models));

      noPermsApp = await baseApp.asRole('reception');
    });

    it('should forbid reading notes on a forbidden object', async () => {
      const response = await noPermsApp.get(`/v1/patient/${forbiddenObject.id}/notes`);
      expect(response).toHaveRequestError();
    });

    it('should forbid writing notes on a forbidden object', async () => {
      const response = await noPermsApp.post('/v1/note').send({
        objectId: forbiddenObject.id,
        objectType: NOTE_OBJECT_TYPES.PATIENT,
        content: chance.paragraph(),
      });

      expect(response).toHaveRequestError();
    });

    it('should forbid editing notes on a forbidden object', async () => {
      const note = await models.Note.create({
        objectId: forbiddenObject.id,
        objectType: NOTE_OBJECT_TYPES.PATIENT,
        content: chance.paragraph(),
      });

      const response = await noPermsApp.put(`/v1/note/${note.id}`).send({
        content: 'forbidden',
      });

      expect(response).toHaveRequestError();
    });
  });
});
