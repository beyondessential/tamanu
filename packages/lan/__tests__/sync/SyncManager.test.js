import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import { REFERENCE_TYPES } from 'shared/constants';
import { fakeProgram, fakeSurvey } from 'shared/test-helpers';

import { createTestContext } from '../utilities';
import { SyncManager } from '~/sync';
import { WebRemote } from '~/sync/WebRemote';
jest.mock('~/sync/WebRemote');

describe('SyncManager', () => {
  let manager;
  let context;
  const remote = new WebRemote();
  beforeAll(async () => {
    context = await createTestContext();
    manager = new SyncManager(context, remote);
  });

  beforeEach(() => remote.pull.mockReset());

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
      remote.pull
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
      await manager.pullAndImport(context.models.ReferenceData);

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
      remote.pull
        .mockResolvedValueOnce({
          records: [{ data }],
          count: 1,
          requestedAt: 1234,
        })
        .mockResolvedValue({
          records: [],
          count: 0,
          requestedAt: 2345,
        });

      // act
      await manager.pullAndImport(context.models.ReferenceData);

      // assert
      const metadata = await context.models.SyncMetadata.findOne({ where: { channel } });
      expect(metadata.lastSynced).toEqual(1234);

      await manager.pullAndImport(context.models.ReferenceData);
      const calls = remote.pull.mock.calls;
      expect(calls[calls.length - 1][1]).toHaveProperty('since', 1234);
    });

    it('handles foreign key constraints in deleted models', async () => {
      // arrange
      const program = fakeProgram();
      await context.models.Program.create(program);

      const survey = fakeSurvey();
      survey.programId = program.id;
      await context.models.Survey.create(survey);

      remote.pull.mockImplementation(channel => {
        const channelCalls = remote.pull.mock.calls.filter(([c]) => c === channel).length;
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
      await manager.runSync();

      // assert
      expect(await context.models.Program.findByPk(program.id)).toEqual(null);
      expect(await context.models.Survey.findByPk(survey.id)).toEqual(null);
    });
  });
});
