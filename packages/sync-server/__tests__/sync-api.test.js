import { subDays, format } from 'date-fns';

import {
  buildNestedEncounter,
  expectDeepSyncRecordsMatch,
  fakeReferenceData,
  fake,
  unsafeSetUpdatedAt,
  upsertAssociations,
  fakeSurvey,
  fakeSurveyResponse,
  fakeSurveyResponseAnswer,
} from 'shared/test-helpers';
import { fakeUUID } from 'shared/utils/generateId';

import { convertFromDbRecord, convertToDbRecord } from 'sync-server/app/convertDbRecord';
import { createTestContext } from './utilities';
import { SUPPORTED_CLIENT_VERSIONS } from '../app/middleware/versionCompatibility';

const MIN_MOBILE_VERSION = SUPPORTED_CLIENT_VERSIONS['Tamanu Mobile'].min;
const MIN_LAN_VERSION = SUPPORTED_CLIENT_VERSIONS['Tamanu LAN Server'].min;

export const makeUpdatedAt = daysAgo =>
  format(subDays(new Date(), daysAgo), "yyyy-MM-dd'T'hh:mm:ss+00:00");

const getUpdatedAtTimestamp = ({ updatedAt }) => new Date(updatedAt).valueOf();

// TODO: add exhaustive tests for sync API for each channel

describe('Sync API', () => {
  // The sync api joins patients to notes but the faker doesn't include them so we add it here for a later comparison
  const fakeSyncRecordPatient = overrides =>
    convertFromDbRecord({
      ...fake(ctx.store.models.Patient),
      ...overrides,
    });
  let oldestPatient;
  let secondOldestPatient;
  let referenceData;

  let app = null;
  let ctx = null;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');
    oldestPatient = { ...fakeSyncRecordPatient(), updatedAt: makeUpdatedAt(20) };
    secondOldestPatient = {
      ...fakeSyncRecordPatient(),
      updatedAt: makeUpdatedAt(10),
    };
    referenceData = {
      ...fakeReferenceData('aaa_early_id_'),
      updatedAt: oldestPatient.updatedAt,
    };

    await Promise.all(
      [oldestPatient, secondOldestPatient].map(async r => {
        await ctx.store.models.Patient.upsert(convertToDbRecord(r));
        await unsafeSetUpdatedAt(ctx.store.sequelize, {
          table: 'patients',
          id: r.data.id,
          updated_at: r.updatedAt,
        });
      }),
    );
    await ctx.store.models.ReferenceData.upsert(referenceData);
    await unsafeSetUpdatedAt(ctx.store.sequelize, {
      table: 'reference_data',
      id: referenceData.id,
      updated_at: referenceData.updatedAt,
    });
  });

  afterAll(async () => ctx.close());

  describe('Checking channels for changes', () => {
    it('should error if no channels are provided', async () => {
      const result = await app.post('/v1/sync/channels').send();
      expect(result).toHaveRequestError();
    });

    it('should return all requested channels that have pending changes since the beginning of time', async () => {
      const result = await app
        .post('/v1/sync/channels')
        .send({ patient: '0', survey: '0', reference: '0' });
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.channelsWithChanges).toEqual(['patient', 'reference']);
    });

    it('should return all requested channels that have pending changes since a sync cursor', async () => {
      const syncCursor = getUpdatedAtTimestamp(secondOldestPatient) - 1;
      const result = await app
        .post('/v1/sync/channels')
        .send({ patient: syncCursor, reference: syncCursor });
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.channelsWithChanges).toEqual(['patient']);
    });

    it('should return all requested channels that have pending changes using different sync cursors', async () => {
      const patientSyncCursor = getUpdatedAtTimestamp(secondOldestPatient) - 1;
      const referenceSyncCursor = getUpdatedAtTimestamp(oldestPatient) - 1;
      const result = await app
        .post('/v1/sync/channels')
        .send({ patient: patientSyncCursor, reference: referenceSyncCursor });
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.channelsWithChanges).toEqual(['patient', 'reference']);
    });

    it('should differentiate timestamp clashes correctly using id', async () => {
      const syncCursor = `${getUpdatedAtTimestamp(referenceData)};${referenceData.id}`;
      const result = await app.post('/v1/sync/channels').send({
        patient: syncCursor,
        reference: syncCursor,
      });
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.channelsWithChanges).toEqual(['patient']);
    });

    const NUM_CHANNELS_TO_TEST = 1000;
    const ALLOWABLE_TIME = 2000;
    const NUM_RUNS = 5;
    it(`handles ${NUM_CHANNELS_TO_TEST} channels in under ${ALLOWABLE_TIME}ms`, async () => {
      // arrange
      // twice the allowable time, plus 100ms per insert for record creation
      jest.setTimeout(ALLOWABLE_TIME * NUM_RUNS * 2 + NUM_CHANNELS_TO_TEST * 100);
      const { Patient, PatientIssue } = ctx.store.models;

      const patients = [];
      const patientIssues = [];
      for (let i = 0; i < NUM_CHANNELS_TO_TEST; i++) {
        const p = fake(Patient);
        patients.push(p);
        patientIssues.push({ ...fake(PatientIssue), patientId: p.id });
      }
      await Patient.bulkCreate(patients);
      await PatientIssue.bulkCreate(patientIssues);

      const patientChannels = patients.map(({ id }) => `patient/${id}/issue`);
      const idsObj = patientChannels.reduce((memo, channel) => ({ ...memo, [channel]: '0' }), {});

      // act
      const run = async () => {
        const startMs = Date.now();
        const result = await app.post('/v1/sync/channels').send(idsObj);
        const endMs = Date.now();
        expect(result).toHaveSucceeded();
        expect(result.body.channelsWithChanges).toEqual(patientChannels);
        return endMs - startMs;
      };
      const times = [];
      for (let i = 0; i < NUM_RUNS; i++) {
        times.push(await run());
      }

      // assert
      const avgTime = times.reduce((a, b) => a + b) / NUM_RUNS;
      expect(avgTime).toBeLessThan(ALLOWABLE_TIME);
    });
  });

  describe('Reads', () => {
    it('should error if no since parameter is provided', async () => {
      const result = await app.get('/v1/sync/patient');
      expect(result).toHaveRequestError();
    });

    it('should get some records', async () => {
      const result = await app.get(`/v1/sync/patient?since=0`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toBeGreaterThan(0);
      expect(body).toHaveProperty('records');
      expect(body).toHaveProperty('cursor');
      expect(body.records.length).toBeGreaterThan(0);

      const firstRecord = body.records[0];
      const { updatedAt, ...oldestWithoutUpdatedAt } = oldestPatient;
      delete oldestWithoutUpdatedAt.data.dateOfDeath; // model has a null, sync response omits null dates

      expect(firstRecord).toEqual(JSON.parse(JSON.stringify(oldestWithoutUpdatedAt)));
      expect(firstRecord).not.toHaveProperty('channel');
      expect(firstRecord.data).not.toHaveProperty('channel');

      // this database implementation detail should be hidden
      // from the api consumer
      expect(firstRecord).not.toHaveProperty('index');
    });

    it('should omit null dates', async () => {
      const { Patient } = ctx.store.models;

      const patientWithDOB = await Patient.create({
        ...(await fake(Patient)),
        firstName: 'patientWithDOB',
      });
      const patientWithoutDOB = await Patient.create({
        ...(await fake(Patient)),
        firstName: 'patientWithoutDOB',
        dateOfBirth: null,
      });

      // Patients need this helper function on sync tests
      await Promise.all([
        await unsafeSetUpdatedAt(ctx.store.sequelize, {
          table: 'patients',
          id: patientWithDOB.id,
          updated_at: makeUpdatedAt(20),
        }),
        await unsafeSetUpdatedAt(ctx.store.sequelize, {
          table: 'patients',
          id: patientWithoutDOB.id,
          updated_at: makeUpdatedAt(20),
        }),
      ]);

      const result = await app.get('/v1/sync/patient?since=0');
      expect(result).toHaveSucceeded();

      const {
        body: { records },
      } = result;
      const withDate = records.find(({ data: { firstName } }) => firstName === 'patientWithDOB');
      expect(withDate).toBeTruthy();
      expect(withDate.data).toHaveProperty('dateOfBirth');
      const withoutDate = records.find(
        ({ data: { firstName } }) => firstName === 'patientWithoutDOB',
      );
      expect(withoutDate).toBeTruthy();
      expect(withoutDate.data).not.toHaveProperty('dateOfBirth');
    });

    it('should not return a count if noCount=true', async () => {
      const result = await app.get(`/v1/sync/patient?since=0&noCount=true`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toBe(null);
      expect(body).toHaveProperty('records');
      expect(body).toHaveProperty('cursor');
      expect(body.records.length).toBeGreaterThan(0);
    });

    it('should filter out older records', async () => {
      const result = await app.get(
        `/v1/sync/patient?since=${getUpdatedAtTimestamp(secondOldestPatient) - 1}`,
      );
      expect(result).toHaveSucceeded();

      const { body } = result;
      const firstRecord = body.records[0].data;
      expect(firstRecord).toHaveProperty('id', secondOldestPatient.data.id);
    });

    it('should split updatedAt conflicts using id', async () => {
      // arrange
      const updatedAt = makeUpdatedAt(5);
      await Promise.all(
        [0, 1].map(async () => {
          const p = fake(ctx.store.models.Patient);
          await ctx.store.models.Patient.upsert(p);
          await unsafeSetUpdatedAt(ctx.store.sequelize, {
            table: 'patients',
            id: p.id,
            updated_at: updatedAt,
          });
        }),
      );
      const recordsInIdOrder = (
        await ctx.store.models.Patient.findAll({ where: { updatedAt }, raw: true })
      ).sort((a, b) => a.id.localeCompare(b.id));
      expect(recordsInIdOrder.length).toEqual(2); // should now be two records with the same updatedAt
      const earlierIdRecord = recordsInIdOrder[0];
      const laterIdRecord = recordsInIdOrder[1];

      // delete the markedForSync field that won't be returned from the sync endpoint
      delete earlierIdRecord.markedForSync;
      delete laterIdRecord.markedForSync;

      // act
      const response1 = await app.get(
        `/v1/sync/patient?since=${getUpdatedAtTimestamp({ updatedAt }) - 1}&limit=1`,
      );
      const { records: firstRecords, cursor: firstCursor } = response1.body;
      const response2 = await app.get(`/v1/sync/patient?since=${firstCursor}&limit=1`);
      const { records: secondRecords, cursor: secondCursor } = response2.body;

      // assert
      expect(firstCursor.split(';')[1]).toEqual(earlierIdRecord.id);
      expectDeepSyncRecordsMatch([earlierIdRecord], firstRecords, {
        nullableDateFields: ['dateOfDeath'],
      });
      expect(secondCursor.split(';')[1]).toEqual(laterIdRecord.id);
      expectDeepSyncRecordsMatch([laterIdRecord], secondRecords, {
        nullableDateFields: ['dateOfDeath'],
      });
    });

    it('should have count and cursor fields', async () => {
      const result = await app.get(
        `/v1/sync/patient?since=${oldestPatient.updatedAt.valueOf() - 1}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('count', expect.any(Number));
      expect(result.body).toHaveProperty('cursor', expect.any(String));
    });

    describe('Filters sensitive SurveyResponseAnswers', () => {
      const patientId = fakeUUID();
      let encounterData;
      let sensitiveSurveyResponseAnswer;

      beforeAll(async () => {
        await ctx.store.models.Encounter.truncate({ cascade: true, force: true });
        encounterData = await buildNestedEncounter(ctx.store.models, patientId);

        // Get already created non sensitive survey to grab the programId
        const nonSensitiveSurveyId = encounterData.surveyResponses[0].surveyId;
        const nonSensitiveSurvey = await ctx.store.models.Survey.findByPk(nonSensitiveSurveyId);

        // Create sensitive survey (with a response and answers) for test
        const sensitiveSurvey = await ctx.store.models.Survey.create({
          ...fakeSurvey(),
          isSensitive: true,
          programId: nonSensitiveSurvey.programId,
        });
        const sensitiveSurveyResponse = {
          ...fakeSurveyResponse(),
          encounterId: encounterData.id,
          surveyId: sensitiveSurvey.id,
        };
        sensitiveSurveyResponseAnswer = {
          ...fakeSurveyResponseAnswer(),
          responseId: sensitiveSurveyResponse.id,
          dataElementId: encounterData.surveyResponses[0].answers[0].dataElementId,
        };

        // Nest sensitive models inside test encounter
        sensitiveSurveyResponse.answers = [sensitiveSurveyResponseAnswer];
        encounterData.surveyResponses.push(sensitiveSurveyResponse);

        // Add encounter and nested records to the DB
        await ctx.store.models.Encounter.create(encounterData);
        await upsertAssociations(ctx.store.models.Encounter, encounterData);
      });

      it('should not filter if client is lan server', async () => {
        const result = await app.get('/v1/sync/surveyResponseAnswer?since=0').set({
          'X-Tamanu-Client': 'Tamanu LAN Server',
          'X-Version': MIN_LAN_VERSION,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.records.length).toBe(2);
        expect(result.body.records[1].data.id).toBe(sensitiveSurveyResponseAnswer.id);
      });

      it('should filter SurveyResponseAnswers on channel surveyResponseAnswer', async () => {
        const result = await app.get('/v1/sync/surveyResponseAnswer?since=0').set({
          'X-Tamanu-Client': 'Tamanu Mobile',
          'X-Version': MIN_MOBILE_VERSION,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.records.length).toBe(1);
        expect(result.body.records[0].data.id).not.toBe(sensitiveSurveyResponseAnswer.id);
      });

      it('should filter SurveyResponseAnswers on channel patient/:patientId/encounter', async () => {
        const result = await app.get(`/v1/sync/patient%2F${patientId}%2Fencounter?since=0`).set({
          'X-Tamanu-Client': 'Tamanu Mobile',
          'X-Version': MIN_MOBILE_VERSION,
        });
        expect(result).toHaveSucceeded();
        expect(result.body.records.length).toBe(1);
        expect(result.body.records[0].data.id).not.toBe(sensitiveSurveyResponseAnswer.id);
      });

      it('should filter if client is not lan server (or not specified)', async () => {
        const result = await app.get(`/v1/sync/patient%2F${patientId}%2Fencounter?since=0`);
        expect(result).toHaveSucceeded();
        expect(result.body.records.length).toBe(1);
        expect(result.body.records[0].data.id).not.toBe(sensitiveSurveyResponseAnswer.id);
      });
    });

    describe('Limits', () => {
      const TOTAL_RECORDS = 20;
      let records = null;

      beforeAll(async () => {
        await ctx.store.models.Patient.truncate({ cascade: true, force: true });

        // instantiate 20 records
        records = new Array(TOTAL_RECORDS)
          .fill(0)
          .map((zero, i) => fakeSyncRecordPatient({ firstName: `test-limits-${i}` }));

        // import in series so there's a predictable order to test against
        await Promise.all(records.map(r => ctx.store.models.Patient.upsert(convertToDbRecord(r))));
      });

      it('should only return $limit records', async () => {
        const result = await app.get(`/v1/sync/patient?since=0&limit=5`);
        expect(result).toHaveSucceeded();
        expect(result.body.records.length).toEqual(5);

        const secondResult = await app.get(`/v1/sync/patient?since=0&limit=3`);
        expect(secondResult).toHaveSucceeded();
        expect(secondResult.body.records.length).toEqual(3);

        // arrays should be the same
        for (let i = 0; i < secondResult.body.records.length; ++i) {
          expect(result.body.records[i].id).toEqual(secondResult.body.records[i].id);
        }
      });

      it('should return records after a cursor with inconsistent limits between calls', async () => {
        const results = [];

        let recordsPulled = 0;
        let cursor = '0';
        do {
          const limit = Math.ceil(Math.random() * 5);
          const url = `/v1/sync/patient?since=${cursor}&limit=${limit}`;
          const result = await app.get(url);
          expect(result).toHaveSucceeded();
          expect(result.body.records.length).toEqual(
            Math.min(limit, TOTAL_RECORDS - recordsPulled),
          );
          results.push(result);
          recordsPulled += limit;
          cursor = result.body.cursor;
        } while (recordsPulled <= TOTAL_RECORDS);

        const responseRecordIds = results
          .map(r => r.body.records)
          .flat()
          .map(r => r.data.firstName.split('_')[0]);
        const expectedRecordIds = new Array(TOTAL_RECORDS)
          .fill(0)
          .map((_, i) => `test-limits-${i}`);

        expect(responseRecordIds.sort()).toEqual(expectedRecordIds.sort());
      });

      it('should include the count of all records beyond since', async () => {
        const result = await app.get(`/v1/sync/patient?since=0&limit=5`);
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('count', TOTAL_RECORDS);

        const secondResult = await app.get(`/v1/sync/patient?since=0&limit=3`);
        expect(secondResult).toHaveSucceeded();
        expect(secondResult.body).toHaveProperty('count', TOTAL_RECORDS);

        const thirdResult = await app.get(
          `/v1/sync/patient?since=${secondResult.body.cursor}&limit=5`,
        );
        expect(thirdResult).toHaveSucceeded();
        expect(thirdResult.body).toHaveProperty('count', TOTAL_RECORDS - 3);
      });
    });

    const patientId = fakeUUID();
    [
      `/v1/sync/patient%2F${patientId}%2Fencounter?since=0`,
      `/v1/sync/labRequest%2Fall%2Fencounter?since=0`,
    ].forEach(url => {
      describe(`from the url ${url}`, () => {
        it('should return nested encounter relationships', async () => {
          // arrange
          await ctx.store.models.Encounter.truncate({ cascade: true, force: true });
          const encounter = await buildNestedEncounter(ctx.store.models, patientId);
          await ctx.store.models.Encounter.create(encounter);
          await upsertAssociations(ctx.store.models.Encounter, encounter);

          // act
          const result = await app.get(url);

          // assert
          expect(result.body).toMatchObject({
            records: [
              {
                data: {
                  id: encounter.id,
                  administeredVaccines: [
                    {
                      data: {
                        id: encounter.administeredVaccines[0].id,
                        encounterId: encounter.id,
                      },
                    },
                  ],
                  surveyResponses: [
                    {
                      data: {
                        id: encounter.surveyResponses[0].id,
                        encounterId: encounter.id,
                        answers: [
                          {
                            data: {
                              id: encounter.surveyResponses[0].answers[0].id,
                              responseId: encounter.surveyResponses[0].id,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          });
          [
            [],
            ['data', 'administeredVaccines', 0],
            ['data', 'surveyResults', 0],
            ['data', 'surveyResults', 0, 'answers', 0],
            ['data', 'surveyResults', 0, 'data', 'answers', 0],
          ].forEach(path => {
            ['updatedAt', 'createdAt', 'deletedAt'].forEach(key => {
              expect(result).not.toHaveProperty([...path, key]);
              expect(result).not.toHaveProperty([...path, 'data', key]);
            });
          });
        });
      });
    });
  });

  describe('Writes', () => {
    beforeAll(async () => {
      await ctx.store.models.Patient.truncate({ cascade: true, force: true });
    });

    it('should add a record to a channel', async () => {
      const precheck = await ctx.store.models.Patient.findAll();
      expect(precheck).toHaveProperty('length', 0);

      const result = await app.post('/v1/sync/patient').send(fakeSyncRecordPatient());
      expect(result).toHaveSucceeded();

      const postcheck = await ctx.store.models.Patient.findAll();
      expect(postcheck.length).toEqual(1);
    });

    it('should add multiple records to reference data', async () => {
      const order = [['createdAt', 'ASC']];
      const precheck = await ctx.store.models.Patient.findAll({ order });
      expect(precheck.length).toEqual(1);

      const record1 = fakeSyncRecordPatient();
      const record2 = fakeSyncRecordPatient();
      const result = await app.post('/v1/sync/patient').send([record1, record2]);
      expect(result).toHaveSucceeded();

      const postcheck = await ctx.store.models.Patient.findAll({ order });
      expect(postcheck.length).toEqual(3);
      const postcheckIds = postcheck
        .slice(1)
        .map(r => r.id)
        .sort();
      expect(postcheckIds).toEqual([record1.data.id, record2.data.id].sort());
    });

    it('should update an existing record in reference data', async () => {
      const record = fakeSyncRecordPatient();
      const result = await app.post('/v1/sync/patient').send(record);

      expect(result).toHaveSucceeded();

      const foundRecords = await ctx.store.models.Patient.findAll();
      const foundRecord = foundRecords.find(r => r.id === record.data.id).get({ plain: true });
      const {
        createdAt,
        updatedAt,
        deletedAt,
        markedForPush,
        markedForSync,
        ...data
      } = foundRecord;
      // Drop the notes before the comparison since foundRecord won't include them
      const { notes, ...comparisonData } = record.data;
      expect(data).toEqual(comparisonData);
    });

    const patientId = fakeUUID();
    [
      `/v1/sync/patient%2F${patientId}%2Fencounter?since=0`,
      `/v1/sync/labRequest%2Fall%2Fencounter?since=0`,
    ].forEach(url => {
      describe(`from the url ${url}`, () => {
        it('should upsert nested encounter relationships', async () => {
          // arrange
          await ctx.store.models.Encounter.truncate({ cascade: true, force: true });
          const encounterToInsert = await buildNestedEncounter(ctx.store.models, patientId);
          await ctx.store.models.Encounter.create(encounterToInsert);
          await upsertAssociations(ctx.store.models.Encounter, encounterToInsert);

          // act
          const getResult = await app.get(url);
          const syncEncounter = getResult.body.records.find(
            ({ data }) => data.id === encounterToInsert.id,
          );
          syncEncounter.data.administeredVaccines[0].data.batch = 'test batch';
          syncEncounter.data.surveyResponses[0].data.result = 3.141592;
          syncEncounter.data.surveyResponses[0].data.answers[0].data.body = 'test body';

          const result = await app
            .post(`/v1/sync/patient%2F${patientId}%2Fencounter?since=0`)
            .send(syncEncounter);

          // assert
          expect(result.body).toHaveProperty('count', 1);
          const encounterAfterPost = await ctx.store.models.Encounter.findOne({
            where: { patientId },
            include: [
              { association: 'administeredVaccines' },
              { association: 'diagnoses' },
              { association: 'medications' },
              {
                association: 'surveyResponses',
                include: [{ association: 'answers' }],
              },
            ],
          });
          expect(encounterAfterPost).toHaveProperty(
            ['administeredVaccines', 0, 'batch'],
            'test batch',
          );
          expect(encounterAfterPost).toHaveProperty(['surveyResponses', 0, 'result'], 3.141592);
          expect(encounterAfterPost).toHaveProperty(
            ['surveyResponses', 0, 'answers', 0, 'body'],
            'test body',
          );
        });
      });
    });

    it('should have count and requestedAt fields', async () => {
      const result = await app.post('/v1/sync/patient').send(fakeSyncRecordPatient());
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('requestedAt', expect.any(Number));
      expect(result.body).toHaveProperty('count', expect.any(Number));
    });
  });

  describe('Deletes', () => {
    beforeEach(async () => {
      await ctx.store.models.Patient.truncate({ cascade: true, force: true });
    });

    describe('on success', () => {
      let patient;
      let record;
      let result;

      beforeEach(async () => {
        patient = fakeSyncRecordPatient();
        await ctx.store.models.Patient.upsert(convertToDbRecord(patient));
        await unsafeSetUpdatedAt(ctx.store.sequelize, {
          table: 'patients',
          id: patient.data.id,
          updated_at: new Date(1971, 0, 1), // 1st Jan 1971, or epoch + 1yr
        });

        // find record
        result = await app.delete(`/v1/sync/patient/${patient.data.id}`);
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('count', 1);
        const getResult = await app.get('/v1/sync/patient?since=0', 0);
        const { records } = getResult.body;
        expect(records).toHaveProperty('length', 1);
        [record] = records;
      });

      it('should add a flag to deleted records', async () => {
        expect(record).toHaveProperty('isDeleted', true);
      });

      it('should remove data for a deleted record', async () => {
        expect(record).toHaveProperty('data');
        expect(record.data).toStrictEqual({ id: patient.data.id });
        expect(record.data).not.toHaveProperty('firstName');
      });

      it('should return tombstones for deleted records', async () => {
        const getResult = await app.get('/v1/sync/patient?since=0');
        expect(getResult).toHaveSucceeded();
        expect(getResult.body).toHaveProperty('count', 1);
        expect(getResult.body.records[0]).toHaveProperty('data.id', patient.data.id);
      });

      it('should update the updatedAt timestamp', async () => {
        const [[{ updated_at: updatedAt }]] = await ctx.store.sequelize.query(
          `
          SELECT updated_at
          FROM patients
          WHERE id = :patientId;
        `,
          {
            replacements: {
              patientId: record.data.id,
            },
          },
        );
        expect(updatedAt.valueOf()).toBeGreaterThan(new Date(1971, 0, 1).valueOf());
      });

      it('should have count and requestedAt fields', async () => {
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('requestedAt', expect.any(Number));
        expect(result.body).toHaveProperty('count', expect.any(Number));
      });
    });

    describe('on failure', () => {
      it('returns a 404 if the record was missing', async () => {
        const result = await app.delete(`/v1/sync/patient/${fakeUUID()}`);
        expect(result).toHaveRequestError(404);
      });

      // TODO: add this once auth is implemented
      it.todo("returns a 403 if the user isn't authenticated");
    });
  });
});
