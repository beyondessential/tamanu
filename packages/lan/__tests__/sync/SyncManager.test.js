import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import { REFERENCE_TYPES } from 'shared/constants';
import {
  fakeProgram,
  fakeSurvey,
  fakePatient,
  buildNestedEncounter,
  upsertAssociations,
} from 'shared/test-helpers';

import { createTestContext } from '../utilities';

describe('SyncManager', () => {
  let context;
  beforeAll(async () => {
    context = await createTestContext();
  });

  beforeEach(() => {
    context.remote.fetchChannelsWithChanges.mockImplementation(channels =>
      Promise.resolve(channels.map(c => c.channel)),
    );
    context.remote.pull.mockReset();
    context.remote.push.mockReset();
  });

  afterEach(() => jest.clearAllMocks());

  describe('pullAndImport', () => {
    it('pulls pages of records and imports them', async () => {
      // arrange
      const records = [
        { id: `test-${uuidv4()}`, code: 'r1', name: 'r1', type: REFERENCE_TYPES.DRUG },
        { id: `test-${uuidv4()}`, code: 'new', name: 'r2', type: REFERENCE_TYPES.DRUG },
      ];
      await context.models.ReferenceData.create({
        ...records[1],
        code: 'old',
      });
      context.remote.pull
        .mockResolvedValueOnce({
          records: [{ data: records[0] }],
          count: 1,
          requestedAt: 1234,
        })
        .mockResolvedValueOnce({
          records: [{ data: records[1] }],
          count: 1,
          requestedAt: 2345,
        })
        .mockResolvedValueOnce({
          records: [],
          count: 0,
          requestedAt: 3456,
        });

      // act
      await context.syncManager.pullAndImport(context.models.ReferenceData);

      // assert
      const createdRecords = await context.models.ReferenceData.findAll({
        where: { id: { [Op.or]: records.map(r => r.id) } },
      });
      records.forEach(record => {
        expect(createdRecords.find(r => r.id === record.id)).toMatchObject(record);
      });
      expect(createdRecords.length).toEqual(records.length);
    });

    it('stores and retrieves the last sync timestamp', async () => {
      // arrange
      const data = { id: `test-${uuidv4()}`, code: 'r1', name: 'r1', type: REFERENCE_TYPES.DRUG };
      const channel = 'reference';
      const now = Date.now();
      context.remote.pull
        .mockResolvedValueOnce({
          records: [{ data }],
          count: 1,
          cursor: `${now};${data.id}`,
        })
        .mockResolvedValue({
          records: [],
          count: 0,
        });

      // act
      await context.syncManager.pullAndImport(context.models.ReferenceData);

      // assert
      const { pullCursor } = await context.models.ChannelSyncPullCursor.findOne({
        where: { channel },
      });
      expect(pullCursor).toEqual(`${now};${data.id}`);

      await context.syncManager.pullAndImport(context.models.ReferenceData);
      const calls = context.remote.pull.mock.calls;
      expect(calls[calls.length - 1][1]).toHaveProperty('since', `${now};${data.id}`);
    });

    it('handles foreign key constraints in deleted models', async () => {
      // arrange
      const program = fakeProgram();
      await context.models.Program.create(program);

      const survey = fakeSurvey();
      survey.programId = program.id;
      await context.models.Survey.create(survey);

      context.remote.pull.mockImplementation(channel => {
        const channelCalls = context.remote.pull.mock.calls.filter(([c]) => c === channel).length;
        if (channelCalls === 1 && channel === 'program') {
          return Promise.resolve({
            records: [{ data: program, isDeleted: true }],
            count: 1,
            requestedAt: 1234,
          });
        }
        if (channelCalls === 1 && channel === 'survey') {
          return Promise.resolve({
            records: [{ data: survey, isDeleted: true }],
            count: 1,
            requestedAt: 1234,
          });
        }
        return Promise.resolve({ records: [], count: 0, requestedAt: 1234 });
      });

      // act
      await context.syncManager.runSync();

      // assert
      expect(await context.models.Program.findByPk(program.id)).toEqual(null);
      expect(await context.models.Survey.findByPk(survey.id)).toEqual(null);
    });
  });

  describe('exportAndPush', () => {
    const getRecord = ({ id }) => context.models.Patient.findByPk(id);

    it('exports pages of records and pushes them', async () => {
      // arrange
      const record = fakePatient();
      await context.models.Patient.create(record);
      context.remote.push.mockResolvedValueOnce({
        count: 1,
        requestedAt: 1234,
      });
      expect(await getRecord(record)).toHaveProperty('markedForPush', true);

      // act
      await context.syncManager.exportAndPush(context.models.Patient);

      // assert
      expect(await getRecord(record)).toHaveProperty('markedForPush', false);
      const { calls } = context.remote.push.mock;
      expect(calls.length).toEqual(1);
      expect(calls[0][0]).toEqual('patient');
      expect(calls[0][1].length).toEqual(1);
      expect(calls[0][1][0].data).toMatchObject({
        ...record,
        dateOfBirth: record?.dateOfBirth?.toISOString(),
      });
    });

    it('marks created records for push', async () => {
      const record = fakePatient();
      await context.models.Patient.create(record);
      expect(await getRecord(record)).toHaveProperty('markedForPush', true);
    });

    it('marks updated records for push', async () => {
      // arrange
      const record = fakePatient();
      await context.models.Patient.create(record);
      await context.models.Patient.update({ markedForPush: false }, { where: { id: record.id } });
      expect(await getRecord(record)).toHaveProperty('markedForPush', false);

      // act
      await (await context.models.Patient.findByPk(record.id)).update({ displayId: 'Fred Smith' });

      // assert
      expect(await getRecord(record)).toHaveProperty('markedForPush', true);
    });
  });

  describe('encounters on channels other than patient', () => {
    it('pushes them', async () => {
      //// arrange
      const patientId = uuidv4();

      // unrelated encounter
      const unrelatedEncounter = await buildNestedEncounter(context, patientId);
      unrelatedEncounter.labRequests = [];
      await context.models.Encounter.create(unrelatedEncounter);
      await upsertAssociations(context.models.Encounter, unrelatedEncounter);

      // encounter for lab request
      const labEncounter = await buildNestedEncounter(context, patientId);
      labEncounter.administeredVaccines = [];
      await context.models.Encounter.create(labEncounter);
      await upsertAssociations(context.models.Encounter, labEncounter);

      // encounter for scheduledVaccine
      const vaccineEncounter = await buildNestedEncounter(context, patientId);
      vaccineEncounter.labRequests = [];
      await context.models.Encounter.create(vaccineEncounter);
      await upsertAssociations(context.models.Encounter, vaccineEncounter);
      jest
        .spyOn(context.models.UserLocalisationCache, 'getLocalisation')
        .mockImplementation(() =>
          Promise.resolve({
            sync: {
              syncAllEncountersForTheseScheduledVaccines: vaccineEncounter.administeredVaccines.map(
                v => v.scheduledVaccineId,
              ),
            },
          }),
        );

      // unmark patient
      await context.models.Patient.update(
        { markedForPush: false, markedForSync: false },
        { where: { id: patientId } },
      );

      //// act
      await context.syncManager.exportAndPush(context.models.Encounter);

      //// assert
      const pushedChannels = context.remote.push.mock.calls.map(([ch]) => ch);
      expect(pushedChannels).toContain('labRequest/all/encounter');
      vaccineEncounter.administeredVaccines.forEach(v => {
        expect(pushedChannels).toContain(`scheduledVaccine/${v.scheduledVaccineId}/encounter`);
      });
      expect(pushedChannels).toHaveLength(2);

      const pushedIds = context.remote.push.mock.calls
        .map(([, array]) => array)
        .flat()
        .map(({ data: { id } }) => id);
      expect(pushedIds).toContain(labEncounter.id);
      expect(pushedIds).toContain(vaccineEncounter.id);
      expect(pushedIds).toHaveLength(2);
    });

    it('pulls them', async () => {
      // arrange
      context.remote.pull.mockResolvedValue({
        records: [],
        count: 0,
      });
      const scheduledVaccineId = 'obviously-fake';
      jest
        .spyOn(context.models.UserLocalisationCache, 'getLocalisation')
        .mockImplementation(() =>
          Promise.resolve({
            sync: {
              syncAllEncountersForTheseScheduledVaccines: [scheduledVaccineId],
            },
          }),
        );

      // act
      await context.syncManager.pullAndImport(context.models.Encounter);

      // assert
      const pulledChannels = context.remote.pull.mock.calls.map(([channel]) => channel);
      expect(pulledChannels).toContain('labRequest/all/encounter');
      expect(pulledChannels).toContain(`scheduledVaccine/${scheduledVaccineId}/encounter`);
      expect(pulledChannels).toHaveLength(2);
    });
  });
});
