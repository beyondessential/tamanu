import {
  createDummyEncounter,
  createDummyPatient,
  randomReferenceId,
} from '@tamanu/database/demoData/patients';
import { NOTE_RECORD_TYPES, NOTE_TYPES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { chance, fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { addMinutes } from 'date-fns';
import { toDateTimeString } from '@tamanu/utils/dateTime';
import { randomSensitiveLabRequest } from '@tamanu/database/demoData/labRequests';

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
      labRequest = await app.post('/api/labRequest').send({
        categoryId,
        displayId: 'TESTID',
        labTestTypeIds,
        patientId: patient.id,
      });
    });

    it('should attach a note to a lab request', async () => {
      const content = chance.paragraph();
      const response = await app.post(`/api/labRequest/${labRequest.body[0].id}/notes`).send({
        content,
        noteTypeId: NOTE_TYPES.OTHER,
      });

      expect(response).toHaveSucceeded();

      const note = await models.Note.findOne({
        where: { id: response.body.id },
      });
      expect(note.content).toEqual(content);
      expect(note.recordType).toEqual('LabRequest');
      expect(note.recordId).toEqual(labRequest.body[0].id);
    });

    it('should error trying to add a note to a sensitive lab request', async () => {
      const labRequestData = await randomSensitiveLabRequest(models, {
        patientId: patient.id,
      });
      const sensitiveLabRequest = await models.LabRequest.createWithTests(labRequestData);
      const content = chance.paragraph();
      const response = await app.post(`/api/labRequest/${sensitiveLabRequest.id}/notes`).send({
        content,
        noteTypeId: NOTE_TYPES.OTHER,
      });

      expect(response).toBeForbidden();
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
      const response = await app.post(`/api/encounter/${encounter.id}/notes`).send({
        content,
        noteTypeId: NOTE_TYPES.SYSTEM,
      });

      expect(response).toHaveSucceeded();

      const note = await models.Note.findOne({
        where: { id: response.body.id },
      });

      expect(note.content).toEqual(content);
      expect(note.recordType).toEqual('Encounter');
      expect(note.recordId).toEqual(encounter.id);
    });

    it('should not write a note on an non-existent record', async () => {
      const response = await app.post('/api/encounter/fakeEncounterId/notes').send({
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
        const response = await noPermsApp.post(`/api/encounter/${encounter.id}/notes`).send({
          content: chance.paragraph(),
          noteTypeId: NOTE_TYPES.SYSTEM,
        });

        expect(response).toBeForbidden();
      });

      it('should forbid editing notes on a forbidden record', async () => {
        const note = await models.Note.createForRecord(
          encounter.id,
          NOTE_RECORD_TYPES.ENCOUNTER,
          NOTE_TYPES.SYSTEM,
          chance.paragraph(),
        );

        const response = await noPermsApp.put(`/api/notes/${note.id}`).send({
          content: 'forbidden',
        });

        expect(response).toBeForbidden();
      });

      it('should forbid editing an encounter note', async () => {
        const note = await models.Note.createForRecord(
          encounter.id,
          NOTE_RECORD_TYPES.ENCOUNTER,
          NOTE_TYPES.SYSTEM,
          chance.paragraph(),
          app.user.id,
        );

        const response = await app.put(`/api/notes/${note.id}`).send({
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
      const note = await models.Note.createForRecord(
        patientCarePlan.id,
        NOTE_RECORD_TYPES.PATIENT_CARE_PLAN,
        NOTE_TYPES.TREATMENT_PLAN,
        chance.paragraph(),
        testUser.id,
      );
      const response = await app.put(`/api/notes/${note.id}`).send({
        content: 'updated',
      });

      expect(response).toHaveSucceeded();
      expect(response.body.id).toEqual(note.id);
      expect(response.body.content).toEqual('updated');
    });
  });

  describe('Revisions', () => {
    let encounter = null;
    let noteGroups = [];
    let noteGroupCount = 0;

    // this one needs a fair bit of data to test meaningfully, so, brace
    // yourself for a big chunk of utility functions to get that all together!

    const postEncounterNote = async (props) => {
      const response = await app
        .post(`/api/encounter/${encounter.id}/notes`)
        .send(fake(models.Note, props));
      expect(response).toHaveSucceeded();
      return response.body;
    };

    const postRevision = async (base, update) => {
      return postEncounterNote({
        ...base,
        id: undefined,
        date: generateDate(),
        revisedById: base.id,
        ...update,
      });
    };

    // note edits are distinguished by date, so they need to be steadily incrementing
    // this function will return a date one minute later each time it's called
    let date = new Date(2023, 1, 1);
    const generateDate = () => {
      date = addMinutes(date, 1);
      return toDateTimeString(date);
    };

    // function to quickly create a note & a bunch of edits to it
    const postEncounterNoteWithRevisions = async (count, props) => {
      const base = await postEncounterNote({
        ...props,
        id: undefined,
        date: generateDate(),
      });
      const edits = [];

      for (let i = 0; i < count; ++i) {
        edits.push(
          await postRevision(base, {
            content: [base.content, 'EDIT', i, i === count - 1 && 'LATEST']
              .filter(Boolean)
              .join(' '),
          }),
        );
      }
      return [base, ...edits];
    };

    beforeAll(async () => {
      encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      // Create a bunch of notes, with a few edits each.
      // These notes will be used in sort/filter later in this describe block.
      // Ideally each test would create its own notes but each test kind of needs
      // a bunch of other unrelated notes to filter out, and so in the interest
      // of speed let's just create all the records in one hit rather than
      // once for every test.
      const data = [
        // some random notes
        ...new Array(12).fill(0),

        // some notes to test filtering by note type
        { noteTypeId: NOTE_TYPES.OTHER, content: 'NOTE FILTER 1' },
        { noteTypeId: NOTE_TYPES.OTHER, content: 'NOTE FILTER 2' },
        { noteTypeId: NOTE_TYPES.OTHER, content: 'NOTE FILTER 3' },

        // one to check that treatment plans get sorted to the top
        { noteTypeId: NOTE_TYPES.TREATMENT_PLAN, content: 'TREATMENT' },

        // for testing making notes historical
        { content: 'TO BE HISTORICAL' },

        // and a few other random notes after so that the test targets
        // aren't all at the start or end
        ...new Array(11).fill(0),
      ];
      noteGroups = [];
      for (let i = 0; i < data.length; ++i) {
        const content = `Test note ${i}`;
        const group = await postEncounterNoteWithRevisions(chance.integer({ min: 1, max: 6 }), {
          content,
          ...data[i],
        });
        noteGroups.push(group);
      }
      noteGroupCount = noteGroups.length;
    });

    it('should create a new revision of a note', async () => {
      noteGroups.forEach(([base, ...revisions]) => {
        expect(base).not.toHaveProperty('revisedById', expect.anything());
        revisions.forEach((r) => expect(r).toHaveProperty('revisedById', base.id));
      });
    });

    it('should list the latest revision of each note', async () => {
      const response = await app.get(
        `/api/encounter/${encounter.id}/notes?rowsPerPage=${noteGroupCount}`,
      );
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('count', noteGroups.length);
      response.body.data.forEach((n) => {
        expect(n.content).toMatch('LATEST');
      });
    });

    it('should paginate notes correctly when they have revisions', async () => {
      // grab the first two pages - they should have the right counts & no duplicates
      const firstPage = await app.get(`/api/encounter/${encounter.id}/notes?rowsPerPage=5`);
      expect(firstPage).toHaveSucceeded();
      expect(firstPage.body.data).toHaveLength(5);

      const secondPage = await app.get(`/api/encounter/${encounter.id}/notes?rowsPerPage=5&page=1`);
      expect(secondPage).toHaveSucceeded();
      expect(secondPage.body.data).toHaveLength(5);

      const returnedRecords = [...firstPage.body.data, ...secondPage.body.data];
      const firstNonTreatment = returnedRecords.findIndex(
        (x) => x.noteTypeId !== NOTE_TYPES.TREATMENT_PLAN,
      );

      // treatment plans should be first, in descending date order
      const treatmentNotes = returnedRecords.slice(0, firstNonTreatment);
      const treatmentDates = treatmentNotes.map((x) => x.revisedBy?.date || x.date);

      // then other notes, same
      const otherNotes = returnedRecords.slice(firstNonTreatment);
      const otherDates = otherNotes.map((x) => x.revisedBy?.date || x.date);

      expect(treatmentDates).toEqual([...treatmentDates].sort().reverse());
      expect(otherDates).toEqual([...otherDates].sort().reverse());
    });

    it('should filter notes correctly when they have revisions', async () => {
      const results = await app.get(
        `/api/encounter/${encounter.id}/notes?noteTypeId=${NOTE_TYPES.OTHER}&rowsPerPage=10`,
      );
      expect(results).toHaveSucceeded();
      results.body.data.forEach((note) => {
        expect(note).toHaveProperty('noteTypeId', NOTE_TYPES.OTHER);
        expect(note.content).toMatch('LATEST');
      });
    });

    // currently (2023-11-22) notes are not sortable even though the API supports it, omitting this test for now
    it.todo('should sort notes correctly when they have revisions');

    it('should exclude a historical note even if its earlier revisions are not historical', async () => {
      const [historicalNote] = noteGroups.find(([base]) => base.content === 'TO BE HISTORICAL');
      await postRevision(historicalNote, {
        content: 'HISTORICAL',
        visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
      });

      const response = await app.get(
        `/api/encounter/${encounter.id}/notes?rowsPerPage=${noteGroupCount}`,
      );
      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('count', noteGroups.length - 1);
      response.body.data.forEach((n) => {
        expect(n.content).not.toMatch('HISTORICAL');
        expect(n.content).toMatch('LATEST');
      });
    });
  });
});
