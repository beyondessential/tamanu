import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isEqual } from 'es-toolkit/compat';
import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from '@tamanu/database/demoData/patients';
import {
  createLabTestTypes,
  randomLabRequest,
  randomSensitiveLabRequest,
} from '@tamanu/database/demoData';
import {
  ENCOUNTER_PRINTOUT_LAB_REQUEST_STATUSES,
  LAB_REQUEST_STATUSES,
  NOTE_TYPES,
} from '@tamanu/constants';
import { fakeUser } from '@tamanu/fake-data/fake';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { createTestContext } from '../utilities';

async function createLabRequest(models, overrides) {
  const labRequest = await models.LabRequest.createWithTests(
    await randomLabRequest(models, { ...overrides }),
  );

  return labRequest;
}

// The printout's list is ordered on when a request reached the status it now holds, which the
// product records by logging each status change. A test that cares about that order moves a
// request on and logs the move at the moment it chooses.
async function reachStatus(models, labRequest, status, reachedAt) {
  await labRequest.update({ status });
  await models.LabRequestLog.create({
    labRequestId: labRequest.id,
    status,
    createdAt: reachedAt,
  });
}

// Far enough apart that no timezone offset can reorder them against a requested date.
const EARLIER = new Date('2026-03-01T12:00:00Z');
const LATER = new Date('2026-03-10T12:00:00Z');
const LATEST = new Date('2026-03-20T12:00:00Z');

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
        statuses.map(status =>
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

  describe('GET encounter lab requests for the results printout', () => {
    // The sensitive filter turns on permission, so these cases need real roles rather than the
    // hardcoded ones.
    disableHardcodedPermissionsForSuite();

    let printoutApp = null;
    let sensitiveApp = null;
    let encounterOnlyApp = null;

    beforeAll(async () => {
      printoutApp = await baseApp.asNewRole([
        ['read', 'Encounter'],
        ['list', 'LabRequest'],
      ]);
      sensitiveApp = await baseApp.asNewRole([
        ['read', 'Encounter'],
        ['list', 'LabRequest'],
        ['list', 'SensitiveLabRequest'],
      ]);
      encounterOnlyApp = await baseApp.asNewRole([['read', 'Encounter']]);
    });

    it('rejects an unauthenticated request', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const result = await baseApp.get(
        `/api/encounter/${encounter.id}/labRequests?excludeSensitive=true`,
      );
      expect(result).toHaveRequestError();
    });

    it('forbids a user without permission to list lab requests', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const result = await encounterOnlyApp.get(
        `/api/encounter/${encounter.id}/labRequests?excludeSensitive=true`,
      );
      expect(result).toBeForbidden();
    });

    it('leaves out sensitive requests with excludeSensitive, even for a privileged user', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const labRequest = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
      });
      const sensitiveLabRequest = await models.LabRequest.createWithTests(
        await randomSensitiveLabRequest(models, {
          patientId: patient.id,
          encounterId: encounter.id,
          status: LAB_REQUEST_STATUSES.PUBLISHED,
        }),
      );

      const withSensitive = await sensitiveApp.get(`/api/encounter/${encounter.id}/labRequests`);
      expect(withSensitive).toHaveSucceeded();
      expect(withSensitive.body.data.map(request => request.id).sort()).toEqual(
        [labRequest.id, sensitiveLabRequest.id].sort(),
      );

      const withoutSensitive = await sensitiveApp.get(
        `/api/encounter/${encounter.id}/labRequests?excludeSensitive=true`,
      );
      expect(withoutSensitive).toHaveSucceeded();
      expect(withoutSensitive.body.data.map(request => request.id)).toEqual([labRequest.id]);
    });

    it('leaves out a request that mixes a sensitive test with a non-sensitive one', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      // One request holding both kinds of test: the sensitive one has to disqualify the whole
      // request, or its results would print alongside the rest.
      const categoryId = await randomReferenceId(models, 'labTestCategory');
      const [sensitiveType] = await createLabTestTypes(models, categoryId, { isSensitive: true });
      const [plainType] = await createLabTestTypes(models, categoryId, { isSensitive: false });
      const mixedLabRequest = await models.LabRequest.createWithTests({
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.PUBLISHED,
        displayId: 'TESTID',
        categoryId,
        labTestTypeIds: [sensitiveType.id, plainType.id],
      });

      const withSensitive = await sensitiveApp.get(`/api/encounter/${encounter.id}/labRequests`);
      expect(withSensitive).toHaveSucceeded();
      expect(withSensitive.body.data.map(request => request.id)).toEqual([mixedLabRequest.id]);

      const withoutSensitive = await sensitiveApp.get(
        `/api/encounter/${encounter.id}/labRequests?excludeSensitive=true`,
      );
      expect(withoutSensitive).toHaveSucceeded();
      expect(withoutSensitive.body.data).toEqual([]);
    });

    it('filters to the requested statuses', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const printable = await Promise.all(
        ENCOUNTER_PRINTOUT_LAB_REQUEST_STATUSES.map(status =>
          createLabRequest(models, {
            patientId: patient.id,
            encounterId: encounter.id,
            status,
          }),
        ),
      );
      await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
      });

      const statusQuery = ENCOUNTER_PRINTOUT_LAB_REQUEST_STATUSES.map(
        (status, index) => `status[${index}]=${status}`,
      ).join('&');
      const result = await printoutApp.get(
        `/api/encounter/${encounter.id}/labRequests?${statusQuery}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.data.map(request => request.id).sort()).toEqual(
        printable.map(request => request.id).sort(),
      );
    });

    it('answers the query the printout actually issues', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const published = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-02 09:00:00',
      });
      const interim = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-01 09:00:00',
      });
      await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-01 08:00:00',
      });
      await models.LabRequest.createWithTests(
        await randomSensitiveLabRequest(models, {
          patientId: patient.id,
          encounterId: encounter.id,
          status: LAB_REQUEST_STATUSES.PUBLISHED,
          requestedDate: '2026-02-28 08:00:00',
        }),
      );

      await reachStatus(models, interim, LAB_REQUEST_STATUSES.INTERIM_RESULTS, EARLIER);
      await reachStatus(models, published, LAB_REQUEST_STATUSES.PUBLISHED, LATER);

      const statusQuery = ENCOUNTER_PRINTOUT_LAB_REQUEST_STATUSES.map(
        (status, index) => `status[${index}]=${status}`,
      ).join('&');
      const result = await sensitiveApp.get(
        `/api/encounter/${encounter.id}/labRequests?${statusQuery}&excludeSensitive=true&orderBy=statusReachedAt&order=ASC`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.data.map(request => request.id)).toEqual([interim.id, published.id]);
    });

    it('orders by when each request reached its current status, oldest first', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      // Requested in one order and published in another, so only one of the two can be what the
      // response is sorted on.
      const requestedFirst = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-01 09:00:00',
      });
      const requestedSecond = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-02 09:00:00',
      });
      const requestedThird = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-03 09:00:00',
      });

      await reachStatus(models, requestedThird, LAB_REQUEST_STATUSES.PUBLISHED, EARLIER);
      await reachStatus(models, requestedFirst, LAB_REQUEST_STATUSES.PUBLISHED, LATER);
      await reachStatus(models, requestedSecond, LAB_REQUEST_STATUSES.PUBLISHED, LATEST);

      const result = await printoutApp.get(
        `/api/encounter/${encounter.id}/labRequests?orderBy=statusReachedAt&order=ASC`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.data.map(request => request.id)).toEqual([
        requestedThird.id,
        requestedFirst.id,
        requestedSecond.id,
      ]);
    });

    it('orders a request whose status was never logged by its requested date', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const earlier = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-01 09:00:00',
      });
      const later = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-01 09:00:00',
      });
      await reachStatus(models, earlier, LAB_REQUEST_STATUSES.PUBLISHED, EARLIER);
      await reachStatus(models, later, LAB_REQUEST_STATUSES.PUBLISHED, LATEST);

      // Moved on without a log, as a request predating the status log would be. Its requested
      // date sits between the other two, days clear of either, so the fallback has to be read in
      // the same timezone as they are for it to land in the middle.
      const unlogged = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-05 09:00:00',
      });
      await unlogged.update({ status: LAB_REQUEST_STATUSES.PUBLISHED });

      const result = await printoutApp.get(
        `/api/encounter/${encounter.id}/labRequests?orderBy=statusReachedAt&order=ASC`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.data.map(request => request.id)).toEqual([
        earlier.id,
        unlogged.id,
        later.id,
      ]);
    });

    it('breaks a tie on status time with the requested date, oldest first', async () => {
      const encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      const requestedLater = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-02 09:00:00',
      });
      const requestedEarlier = await createLabRequest(models, {
        patientId: patient.id,
        encounterId: encounter.id,
        status: LAB_REQUEST_STATUSES.RESULTS_PENDING,
        requestedDate: '2026-03-01 09:00:00',
      });

      await reachStatus(models, requestedLater, LAB_REQUEST_STATUSES.PUBLISHED, EARLIER);
      await reachStatus(models, requestedEarlier, LAB_REQUEST_STATUSES.PUBLISHED, EARLIER);

      const result = await printoutApp.get(
        `/api/encounter/${encounter.id}/labRequests?orderBy=statusReachedAt&order=ASC`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body.data.map(request => request.id)).toEqual([
        requestedEarlier.id,
        requestedLater.id,
      ]);
    });
  });
});
