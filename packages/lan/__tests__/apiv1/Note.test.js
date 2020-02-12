import { createDummyPatient, createDummyVisit } from 'shared/demoData/patients';
import { createTestContext } from '../utilities';

import Chance from 'chance';

const chance = new Chance();

const { baseApp, models } = createTestContext();

describe('Note', () => {
  let patient = null;
  let app = null;
  beforeAll(async () => {
    patient = await models.Patient.create(createDummyPatient());
    app = await baseApp.asRole('practitioner');
  });

  it('should attach a note to a patient', async () => {
    const content = chance.paragraph();
    const response = await app.post('/v1/note').send({
      objectId: patient.id,
      objectType: 'patient',
      content,
    });

    expect(response).toHaveSucceeded();

    const note = await models.Note.findByPk(response.body.id);
    expect(note.content).toEqual(content);
    expect(note.objectType).toEqual('patient');
    expect(note.objectId).toEqual(patient.id);
  });

  test.todo('should attach a note to a visit');

  it('should edit a note', async () => {
    const note = await models.Note.create({
      content: chance.paragraph(),
      objectId: patient.id,
      objectType: 'patient',
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
      objectType: 'patient',
      content: chance.paragraph(),
    });

    expect(response).toHaveRequestError();
  });

  describe('permission failures', () => {
    test.todo('should forbid reading notes on a forbidden object');
    test.todo('should forbid writing notes on a forbidden object');
    test.todo('should forbid editing notes on a forbidden object');
  });

});
