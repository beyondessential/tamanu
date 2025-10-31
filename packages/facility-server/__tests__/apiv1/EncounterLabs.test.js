import { isEqual } from 'lodash';
import { createDummyEncounter, createDummyPatient } from '@tamanu/database/demoData/patients';
import { randomLabRequest, randomSensitiveLabRequest } from '@tamanu/database/demoData';
import { LAB_REQUEST_STATUSES, NOTE_TYPES } from '@tamanu/constants';
import { fakeUser } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

async function createLabRequest(models, overrides) {
  const labRequest = await models.LabRequest.createWithTests(
    await randomLabRequest(models, { ...overrides }),
  );

  return labRequest;
}

describe('Encounter labs', () => {
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

  describe('GET encounter lab requests', () => {
    it('should get a list of lab requests', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const labRequest1 = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });

      const labRequest2 = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });

      const result = await app.get(`/api/encounter/${encounter.id}/labRequests`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        count: 2,
        data: expect.any(Array),
      });
      expect(
        isEqual([labRequest1.id, labRequest2.id], [result.body.data[0].id, result.body.data[1].id]),
      ).toBe(true);
    });

    it('Should not include lab requests with a status of deleted or entered in error', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const statuses = [
        LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        LAB_REQUEST_STATUSES.RECEPTION_PENDING,
        LAB_REQUEST_STATUSES.CANCELLED,
        LAB_REQUEST_STATUSES.INVALIDATED,
        LAB_REQUEST_STATUSES.DELETED,
        LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
      ];

      await Promise.all(
        statuses.map((status) =>
          createLabRequest(models, {
            patientId: patient.id,
            encounterId: encounter.id,
            status,
          }),
        ),
      );

      const result = await app.get(`/api/encounter/${encounter.id}/labRequests`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(4);
      expect(result.body.data.length).toEqual(4);
    });

    it('should get the correct count for a list of lab requests', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });
      await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });

      const result = await app.get(`/api/encounter/${encounter.id}/labRequests`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toEqual(2);
      expect(result.body.data.length).toEqual(2);
    });

    it('should get a list of lab requests filtered by status query parameter', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const labRequest1 = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });
      await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
      });

      const result = await app.get(
        `/api/encounter/${encounter.id}/labRequests?status=reception_pending`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        count: 1,
        data: expect.any(Array),
      });
      expect(labRequest1.id).toEqual(result.body.data[0].id);
    });

    it('should get a list of lab requests NOT including associated note pages if NOT specified in query parameter', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const labRequest1 = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });
      await labRequest1.createNote({
        noteTypeId: NOTE_TYPES.AREA_TO_BE_IMAGED,
        content: 'Testing lab request note',
        authorId: app.user.id,
      });

      const result = await app.get(`/api/encounter/${encounter.id}/labRequests`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        count: 1,
        data: expect.any(Array),
      });
      expect(labRequest1.id).toEqual(result.body.data[0].id);
      expect(result.body.data[0].notes).not.toBeDefined();
    });

    it('should get a list of lab requests including associated note pages if specified in query parameter', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const labRequest1 = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });

      const note = await labRequest1.createNote({
        noteTypeId: NOTE_TYPES.AREA_TO_BE_IMAGED,
        content: 'Testing lab request note',
        authorId: app.user.id,
      });

      const result = await app.get(`/api/encounter/${encounter.id}/labRequests?includeNotes=true`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        count: 1,
        data: expect.any(Array),
      });
      expect(labRequest1.id).toEqual(result.body.data[0].id);
      expect(result.body.data[0].notes[0].content).toEqual(note.content);
    });

    it('should only return non-sensitive lab requests (all lab tests are non-sensitive)', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const labRequest1 = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });

      const labRequestData = await randomSensitiveLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RECEPTION_PENDING,
      });
      await models.LabRequest.createWithTests(labRequestData);

      const result = await app.get(`/api/encounter/${encounter.id}/labRequests`);
      expect(result).toHaveSucceeded();
      expect(result.body.count).toBe(2);

      // The count will match number of lab requests without accounting for sensitive ones
      // so that's why we ensure there is only one lab request included
      expect(result.body.data.length).toBe(1);
      expect(result.body.data[0].id).toBe(labRequest1.id);
    });
  });
});
