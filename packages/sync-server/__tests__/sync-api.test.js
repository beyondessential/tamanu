import { subDays, format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import {
  buildNestedEncounter,
  expectDeepSyncRecordsMatch,
  fakePatient,
  fakeReferenceData,
  unsafeSetUpdatedAt,
  upsertAssociations,
} from 'shared/test-helpers';

import { convertFromDbRecord, convertToDbRecord } from 'sync-server/app/convertDbRecord';
import { createTestContext } from './utilities';

export const makeUpdatedAt = daysAgo =>
  format(subDays(new Date(), daysAgo), "yyyy-MM-dd'T'hh:mm:ss+00:00");

const getUpdatedAtTimestamp = ({ updatedAt }) => new Date(updatedAt).valueOf();

const fakeSyncRecordPatient = (...args) => convertFromDbRecord(fakePatient(...args));

const OLDEST_PATIENT = { ...fakeSyncRecordPatient('oldest_'), updatedAt: makeUpdatedAt(20) };
const SECOND_OLDEST_PATIENT = {
  ...fakeSyncRecordPatient('second-oldest_'),
  updatedAt: makeUpdatedAt(10),
};
const REFERENCE_DATA = {
  ...fakeReferenceData('aaa_early_id_'),
  updatedAt: OLDEST_PATIENT.updatedAt,
};

// TODO: add exhaustive tests for sync API for each channel

describe('Sync API', () => {
  let app = null;
  let ctx = null;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');

    await Promise.all(
      [OLDEST_PATIENT, SECOND_OLDEST_PATIENT].map(async r => {
        await ctx.store.models.Patient.upsert(convertToDbRecord(r));
        await unsafeSetUpdatedAt(ctx.store.sequelize, {
          table: 'patients',
          id: r.data.id,
          updated_at: r.updatedAt,
        });
      }),
    );
    await ctx.store.models.ReferenceData.upsert(REFERENCE_DATA);
    await unsafeSetUpdatedAt(ctx.store.sequelize, {
      table: 'reference_data',
      id: REFERENCE_DATA.id,
      updated_at: REFERENCE_DATA.updatedAt,
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
      const syncCursor = getUpdatedAtTimestamp(SECOND_OLDEST_PATIENT) - 1;
      const result = await app
        .post('/v1/sync/channels')
        .send({ patient: syncCursor, reference: syncCursor });
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.channelsWithChanges).toEqual(['patient']);
    });

    it('should return all requested channels that have pending changes using different sync cursors', async () => {
      const patientSyncCursor = getUpdatedAtTimestamp(SECOND_OLDEST_PATIENT) - 1;
      const referenceSyncCursor = getUpdatedAtTimestamp(OLDEST_PATIENT) - 1;
      const result = await app
        .post('/v1/sync/channels')
        .send({ patient: patientSyncCursor, reference: referenceSyncCursor });
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.channelsWithChanges).toEqual(['patient', 'reference']);
    });

    it('should differentiate timestamp clashes correctly using id', async () => {
      const syncCursor = `${getUpdatedAtTimestamp(REFERENCE_DATA)};${REFERENCE_DATA.id}`;
      const result = await app.post('/v1/sync/channels').send({
        patient: syncCursor,
        reference: syncCursor,
      });
      expect(result).toHaveSucceeded();
      const { body } = result;
      expect(body.channelsWithChanges).toEqual(['patient']);
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
      const { updatedAt, ...oldestWithoutUpdatedAt } = OLDEST_PATIENT;
      expect(firstRecord).toEqual(JSON.parse(JSON.stringify(oldestWithoutUpdatedAt)));
      expect(firstRecord).not.toHaveProperty('channel');
      expect(firstRecord.data).not.toHaveProperty('channel');

      // this database implementation detail should be hidden
      // from the api consumer
      expect(firstRecord).not.toHaveProperty('index');
    });

    it('should filter out older records', async () => {
      const result = await app.get(
        `/v1/sync/patient?since=${getUpdatedAtTimestamp(SECOND_OLDEST_PATIENT) - 1}`,
      );
      expect(result).toHaveSucceeded();

      const { body } = result;
      const firstRecord = body.records[0];
      expect(firstRecord).toHaveProperty('id', SECOND_OLDEST_PATIENT.id);
    });

    it('should split updatedAt conflicts using id', async () => {
      // arrange
      const updatedAt = makeUpdatedAt(5);
      await Promise.all(
        [0, 1].map(async () => {
          const p = fakePatient();
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
      expectDeepSyncRecordsMatch([earlierIdRecord], firstRecords);
      expect(secondCursor.split(';')[1]).toEqual(laterIdRecord.id);
      expectDeepSyncRecordsMatch([laterIdRecord], secondRecords);
    });

    it('should have count and cursor fields', async () => {
      const result = await app.get(
        `/v1/sync/patient?since=${OLDEST_PATIENT.updatedAt.valueOf() - 1}`,
      );
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('count', expect.any(Number));
      expect(result.body).toHaveProperty('cursor', expect.any(String));
    });

    describe('Limits', () => {
      const TOTAL_RECORDS = 20;
      let records = null;

      beforeAll(async () => {
        await ctx.store.models.Patient.destroy({ where: {}, force: true });

        // instantiate 20 records
        records = new Array(TOTAL_RECORDS)
          .fill(0)
          .map((zero, i) => fakeSyncRecordPatient(`test-limits-${i}_`));

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

    it('should return nested encounter relationships', async () => {
      // arrange
      const patientId = uuidv4();
      const encounter = await buildNestedEncounter(ctx.store, patientId);
      await ctx.store.models.Encounter.create(encounter);
      await upsertAssociations(ctx.store.models.Encounter, encounter);

      // act
      const result = await app.get(`/v1/sync/patient%2F${patientId}%2Fencounter?since=0`);

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

  describe('Writes', () => {
    beforeAll(async () => {
      await ctx.store.models.Patient.destroy({ where: {}, force: true });
    });

    it('should add a record to a channel', async () => {
      const precheck = await ctx.store.findSince('patient', '0');
      expect(precheck).toHaveProperty('length', 0);

      const result = await app.post('/v1/sync/patient').send(fakeSyncRecordPatient());
      expect(result).toHaveSucceeded();

      const postcheck = await ctx.store.findSince('patient', '0');
      expect(postcheck.length).toEqual(1);
    });

    it('should add multiple records to reference data', async () => {
      const precheck = await ctx.store.findSince('patient', '0');
      expect(precheck.length).toEqual(1);

      const record1 = fakeSyncRecordPatient();
      const record2 = fakeSyncRecordPatient();
      const result = await app.post('/v1/sync/patient').send([record1, record2]);
      expect(result).toHaveSucceeded();

      const postcheck = await ctx.store.findSince('patient', '0');
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

      const foundRecords = await ctx.store.findSince('patient', '0');
      const foundRecord = foundRecords.find(r => r.id === record.data.id);
      const {
        createdAt,
        updatedAt,
        deletedAt,
        markedForPush,
        markedForSync,
        ...data
      } = foundRecord;
      expect(data).toEqual(record.data);
    });

    it('should upsert nested encounter relationships', async () => {
      // arrange
      const patientId = uuidv4();
      const encounterToInsert = await buildNestedEncounter(ctx.store, patientId);
      await ctx.store.models.Encounter.create(encounterToInsert);
      await upsertAssociations(ctx.store.models.Encounter, encounterToInsert);

      // act
      const getResult = await app.get(`/v1/sync/patient%2F${patientId}%2Fencounter?since=0`);
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
      expect(encounterAfterPost).toHaveProperty(['administeredVaccines', 0, 'batch'], 'test batch');
      expect(encounterAfterPost).toHaveProperty(['surveyResponses', 0, 'result'], 3.141592);
      expect(encounterAfterPost).toHaveProperty(
        ['surveyResponses', 0, 'answers', 0, 'body'],
        'test body',
      );
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
      await ctx.store.models.Patient.destroy({ where: {}, force: true });
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
        const records = getResult.body.records;
        expect(records).toHaveProperty('length', 1);
        record = records[0];
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
        const result = await app.delete(`/v1/sync/patient/${uuidv4()}`);
        expect(result).toHaveRequestError(404);
      });

      // TODO: add this once auth is implemented
      it.todo("returns a 403 if the user isn't authenticated");
    });
  });
});
