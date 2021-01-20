import { subDays, subHours } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import { convertFromDbRecord, convertToDbRecord } from 'sync-server/app/convertDbRecord';

import { createTestContext, unsafeSetUpdatedAt } from './utilities';
import { fakePatient } from './fake';
import { buildNestedEncounter } from './factory';

const makeDate = (daysAgo, hoursAgo = 0) => {
  return subHours(subDays(new Date(), daysAgo), hoursAgo).valueOf();
};

const compareRecordsById = (a, b) => a.data.id.localeCompare(b.data.id);

const fakeSyncRecordPatient = (...args) => convertFromDbRecord(fakePatient(...args));

const OLDEST = { ...fakeSyncRecordPatient('oldest_'), lastSynced: makeDate(20) };
const SECOND_OLDEST = { ...fakeSyncRecordPatient('second-oldest_'), lastSynced: makeDate(10) };

describe('Sync API', () => {
  let app = null;
  let ctx = null;
  beforeAll(async () => {
    ctx = await createTestContext();
    app = await ctx.baseApp.asRole('practitioner');

    await Promise.all(
      [OLDEST, SECOND_OLDEST].map(async r => {
        await ctx.store.insert('patient', convertToDbRecord(r));
        await unsafeSetUpdatedAt(ctx.store, {
          table: 'patients',
          id: r.data.id,
          updated_at: new Date(r.lastSynced),
        });
      }),
    );
  });

  afterAll(async () => ctx.close());

  describe('Reads', () => {
    it('should error if no since parameter is provided', async () => {
      const result = await app.get('/v1/sync/patient');
      expect(result).toHaveRequestError();
    });

    it('should get some records', async () => {
      const result = await app.get(`/v1/sync/patient?since=${OLDEST.lastSynced - 1}`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      expect(body.count).toBeGreaterThan(0);
      expect(body).toHaveProperty('records');
      expect(body).toHaveProperty('requestedAt');
      expect(body.records.length).toBeGreaterThan(0);

      const firstRecord = body.records[0];
      expect(firstRecord).toEqual(JSON.parse(JSON.stringify(OLDEST)));
      expect(firstRecord).not.toHaveProperty('channel');
      expect(firstRecord.data).not.toHaveProperty('channel');

      // this database implementation detail should be hidden
      // from the api consumer
      expect(firstRecord).not.toHaveProperty('index');
    });

    it('should filter out older records', async () => {
      const result = await app.get(`/v1/sync/patient?since=${SECOND_OLDEST.lastSynced - 1}`);
      expect(result).toHaveSucceeded();

      const { body } = result;
      const firstRecord = body.records[0];
      expect(firstRecord).toHaveProperty('lastSynced', SECOND_OLDEST.lastSynced);
    });

    describe('Pagination', () => {
      const TOTAL_RECORDS = 20;
      let records = null;

      beforeAll(async () => {
        await ctx.store.unsafeRemoveAllOfChannel('patient');

        // instantiate 20 records
        records = new Array(TOTAL_RECORDS)
          .fill(0)
          .map((zero, i) => fakeSyncRecordPatient(`test-pagination-${i}_`));

        // import in series so there's a predictable order to test against
        await Promise.all(records.map(r => ctx.store.insert('patient', convertToDbRecord(r))));
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

      it('should return a second page of records', async () => {
        const PAGE_SIZE = 5;
        const PAGE_COUNT = Math.ceil(TOTAL_RECORDS / PAGE_SIZE);
        const results = [];

        for (let i = 0; i < PAGE_COUNT; ++i) {
          const url = `/v1/sync/patient?since=0&limit=5&page=${i}`;
          const result = await app.get(url);
          expect(result).toHaveSucceeded();
          expect(result.body.records.length).toEqual(5);
          results.push(result);
        }

        const responseRecordIds = results
          .map(r => r.body.records)
          .flat()
          .map(r => r.data.firstName.split('_')[0]);
        const expectedRecordIds = new Array(TOTAL_RECORDS)
          .fill(0)
          .map((_, i) => `test-pagination-${i}`);

        expect(responseRecordIds.sort()).toEqual(expectedRecordIds.sort());
      });

      it('should include the count of the entire query', async () => {
        const result = await app.get(`/v1/sync/patient?since=0&limit=5`);
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('count', TOTAL_RECORDS);

        const secondResult = await app.get(`/v1/sync/patient?since=0&limit=3`);
        expect(secondResult).toHaveSucceeded();
        expect(secondResult.body).toHaveProperty('count', TOTAL_RECORDS);

        const thirdResult = await app.get(`/v1/sync/patient?since=0&limit=5&page=2`);
        expect(thirdResult).toHaveSucceeded();
        expect(thirdResult.body).toHaveProperty('count', TOTAL_RECORDS);
      });
    });

    it('should return nested encounter relationships', async () => {
      // arrange
      const patientId = uuidv4();
      const encounter = await buildNestedEncounter({ wrapper: ctx.store }, patientId)();
      console.log(encounter);
      await ctx.store.insert(`patient/${patientId}/encounter`, encounter);

      // act
      const result = await app.get(`/v1/sync/patient%2F${patientId}%2Fencounter?since=0`);

      // assert
      expect(result.body).toMatchObject({
        records: {
          lastSynced: expect.any(Date),
          data: {
            id: encounter.id,
            administeredVaccines: [
              {
                lastSynced: expect.any(Date),
                data: {
                  id: encounter.administeredVaccines[0].id,
                  encounterId: encounter.id,
                },
              },
            ],
            surveyResponses: [
              {
                lastSynced: expect.any(Date),
                data: {
                  id: encounter.surveyResponses[0].id,
                  encounterId: encounter.id,
                  answers: [
                    {
                      lastSynced: expect.any(Date),
                      data: {
                        id: encounter.surveyResponses[0].answers[0].id,
                        resultId: encounter.surveyResponses[0].id,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
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
      await ctx.store.unsafeRemoveAllOfChannel('patient');
    });

    it('should add a record to a channel', async () => {
      const precheck = await ctx.store.findSince('patient', 0);
      expect(precheck).toHaveProperty('length', 0);

      const result = await app.post('/v1/sync/patient').send(fakeSyncRecordPatient());
      expect(result).toHaveSucceeded();

      const postcheck = await ctx.store.findSince('patient', 0);
      expect(postcheck.length).toEqual(1);
    });

    it('should add multiple records to reference data', async () => {
      const precheck = await ctx.store.findSince('patient', 0);
      expect(precheck.length).toEqual(1);

      const record1 = fakeSyncRecordPatient();
      const record2 = fakeSyncRecordPatient();
      const result = await app.post('/v1/sync/patient').send([record1, record2]);
      expect(result).toHaveSucceeded();

      const postcheck = await ctx.store.findSince('patient', 0);
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

      const foundRecords = await ctx.store.findSince('patient', 0);
      const foundRecord = foundRecords.find(r => r.id === record.data.id);
      const { createdAt, updatedAt, deletedAt, ...data } = foundRecord;
      expect(data).toEqual(record.data);
    });

    it.todo('should insert configured nested relationships');
  });

  describe('Deletes', () => {
    beforeEach(async () => {
      await ctx.store.unsafeRemoveAllOfChannel('patient');
    });

    describe('on success', () => {
      let patient;
      let record;

      beforeEach(async () => {
        patient = fakeSyncRecordPatient();
        await ctx.store.insert('patient', convertToDbRecord(patient));
        await unsafeSetUpdatedAt(ctx.store, {
          table: 'patients',
          id: patient.data.id,
          updated_at: new Date(1971, 0, 1), // 1st Jan 1971, or epoch + 1yr
        });

        // find record
        const result = await app.delete(`/v1/sync/patient/${patient.data.id}`);
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
        const result = await app.get('/v1/sync/patient?since=0');
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('count', 1);
        expect(result.body.records[0]).toHaveProperty('data.id', patient.data.id);
      });

      it('should update the lastSynced timestamp', async () => {
        expect(record.lastSynced.valueOf()).toBeGreaterThan(new Date(1971, 0, 1).valueOf());
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
