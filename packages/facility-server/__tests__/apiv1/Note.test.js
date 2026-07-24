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

    it('should include editCount matching the number of revisions on each note', async () => {
      const response = await app.get(
        `/api/encounter/${encounter.id}/notes?rowsPerPage=${noteGroupCount}`,
      );
      expect(response).toHaveSucceeded();
      const expectedEditCountById = {};
      noteGroups.forEach((group) => {
        // group = [base, ...revisions]; the latest revision is the one returned by the list endpoint
        const latest = group[group.length - 1];
        expectedEditCountById[latest.id] = group.length - 1;
      });
      response.body.data.forEach((n) => {
        expect(n.editCount).toEqual(expectedEditCountById[n.id]);
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

      expect(treatmentDates).toEqual(treatmentDates.toSorted().reverse());
      expect(otherDates).toEqual(otherDates.toSorted().reverse());
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

  describe('Search and filter', () => {
    let encounter = null;
    let authorA = null; // the requesting user
    let authorB = null;
    let authorC = null;

    const makeNote = (props) =>
      models.Note.create({
        recordType: NOTE_RECORD_TYPES.ENCOUNTER,
        recordId: encounter.id,
        noteTypeId: NOTE_TYPES.OTHER,
        authorId: authorA.id,
        ...props,
      });

    const getNotes = (queryString) =>
      app.get(`/api/encounter/${encounter.id}/notes?rowsPerPage=20&${queryString}`);

    const contentsOf = (response) => response.body.data.map((n) => n.content).sort();

    beforeAll(async () => {
      encounter = await models.Encounter.create({
        ...(await createDummyEncounter(models)),
        patientId: patient.id,
      });

      authorA = app.user;
      authorB = testUser;
      authorC = await models.User.create({
        email: 'authorc@something.com',
        displayName: 'Author C',
        password: 'abcdefg123456',
        role: 'practitioner',
      });

      await makeNote({ content: 'alpha apple', date: '2024-01-10 09:00:00', authorId: authorA.id });
      await makeNote({ content: 'beta banana', date: '2024-02-10 09:00:00', authorId: authorB.id });
      // authored by A, on behalf of C
      await makeNote({
        content: 'gamma cherry',
        date: '2024-03-10 09:00:00',
        authorId: authorA.id,
        onBehalfOfId: authorC.id,
      });
      await makeNote({
        content: 'delta treatment',
        date: '2024-04-10 09:00:00',
        authorId: authorA.id,
        noteTypeId: NOTE_TYPES.TREATMENT_PLAN,
      });
      // an edited note: original written by A, revised by B
      const epsilonRoot = await makeNote({
        content: 'epsilon original',
        date: '2024-05-10 09:00:00',
        authorId: authorA.id,
      });
      await makeNote({
        content: 'epsilon edited',
        date: '2024-05-11 09:00:00',
        authorId: authorB.id,
        revisedById: epsilonRoot.id,
      });
    });

    describe('free text search', () => {
      it('filters notes by a contains match on the content', async () => {
        const response = await getNotes('search=banana');
        expect(response).toHaveSucceeded();
        expect(contentsOf(response)).toEqual(['beta banana']);
      });

      it('is case-insensitive', async () => {
        const response = await getNotes('search=BANANA');
        expect(response).toHaveSucceeded();
        expect(contentsOf(response)).toEqual(['beta banana']);
      });

      it('matches the latest revision content, not superseded revisions', async () => {
        const edited = await getNotes('search=edited');
        expect(contentsOf(edited)).toEqual(['epsilon edited']);

        const original = await getNotes('search=original');
        expect(original.body.data).toHaveLength(0);
      });

      it('treats ILIKE wildcards in the search term literally', async () => {
        // Use a dedicated encounter so these notes don't affect the shared counts above.
        const wildcardEncounter = await models.Encounter.create({
          ...(await createDummyEncounter(models)),
          patientId: patient.id,
        });
        const makeWildcardNote = (content, date) =>
          models.Note.create({
            recordType: NOTE_RECORD_TYPES.ENCOUNTER,
            recordId: wildcardEncounter.id,
            noteTypeId: NOTE_TYPES.OTHER,
            authorId: authorA.id,
            content,
            date,
          });
        await makeWildcardNote('progress 100% complete', '2024-06-01 09:00:00');
        // Would be a false positive if '%' were treated as a wildcard.
        await makeWildcardNote('100 items done', '2024-06-02 09:00:00');

        const response = await app.get(
          `/api/encounter/${wildcardEncounter.id}/notes?search=${encodeURIComponent(
            '100%',
          )}&rowsPerPage=20`,
        );
        expect(response).toHaveSucceeded();
        expect(response.body.data.map((n) => n.content)).toEqual(['progress 100% complete']);
      });
    });

    describe('author filter', () => {
      it('matches notes authored by the selected user', async () => {
        const response = await getNotes(`authorId=${authorB.id}`);
        expect(response).toHaveSucceeded();
        // authored 'beta banana' and edited the epsilon note
        expect(contentsOf(response)).toEqual(['beta banana', 'epsilon edited']);
      });

      it('matches notes written on behalf of the selected user', async () => {
        const response = await getNotes(`authorId=${authorC.id}`);
        expect(response).toHaveSucceeded();
        expect(contentsOf(response)).toEqual(['gamma cherry']);
      });

      it('matches the original author even when someone else edited the note', async () => {
        const response = await getNotes(`authorId=${authorA.id}`);
        expect(response).toHaveSucceeded();
        expect(contentsOf(response)).toEqual(
          ['alpha apple', 'gamma cherry', 'delta treatment', 'epsilon edited'].sort(),
        );
      });
    });

    describe('date range filter', () => {
      it('filters between both boundaries using the original note date', async () => {
        const response = await getNotes('fromDate=2024-02-01&toDate=2024-03-31');
        expect(response).toHaveSucceeded();
        expect(contentsOf(response)).toEqual(['beta banana', 'gamma cherry'].sort());
      });

      it('applies only a lower bound when just fromDate is set', async () => {
        const response = await getNotes('fromDate=2024-04-01');
        expect(response).toHaveSucceeded();
        expect(contentsOf(response)).toEqual(['delta treatment', 'epsilon edited'].sort());
      });

      it('applies only an upper bound when just toDate is set', async () => {
        const response = await getNotes('toDate=2024-01-31');
        expect(response).toHaveSucceeded();
        expect(contentsOf(response)).toEqual(['alpha apple']);
      });

      it('filters edited notes by their original date, not the latest revision date', async () => {
        // epsilon's original note is 2024-05-10, its latest revision is 2024-05-11
        const response = await getNotes('fromDate=2024-05-10&toDate=2024-05-10');
        expect(response).toHaveSucceeded();
        expect(contentsOf(response)).toEqual(['epsilon edited']);
      });
    });

    it('applies multiple filters together', async () => {
      const response = await getNotes(`authorId=${authorB.id}&search=banana`);
      expect(response).toHaveSucceeded();
      expect(contentsOf(response)).toEqual(['beta banana']);
    });

    it('pins treatment plan notes to the top of filtered results', async () => {
      const response = await getNotes(`authorId=${authorA.id}`);
      expect(response).toHaveSucceeded();
      expect(response.body.data[0].noteTypeId).toBe(NOTE_TYPES.TREATMENT_PLAN);
      expect(response.body).toHaveProperty('count', 4);
    });

    it('returns non-treatment-plan results in reverse chronological order', async () => {
      const response = await getNotes('');
      expect(response).toHaveSucceeded();
      const nonTreatmentDates = response.body.data
        .filter((n) => n.noteTypeId !== NOTE_TYPES.TREATMENT_PLAN)
        .map((n) => n.revisedBy?.date || n.date);
      expect(nonTreatmentDates).toEqual([...nonTreatmentDates].sort().reverse());
    });
  });
});
