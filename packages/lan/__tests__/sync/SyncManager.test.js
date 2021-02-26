import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import { REFERENCE_TYPES } from 'shared/constants';

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

  beforeEach(() => remote.receive.mockReset());

  describe('receiveAndImport', () => {
    it('receives pages of records and imports them', async () => {
      // arrange
      const records = [
        { id: `test-${uuidv4()}`, code: 'r1', name: 'r1', type: REFERENCE_TYPES.DRUG },
        { id: `test-${uuidv4()}`, code: 'new', name: 'r2', type: REFERENCE_TYPES.DRUG },
      ];
      await context.models.ReferenceData.create({
        ...records[1],
        code: 'old',
      });
      remote.receive
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
      await manager.receiveAndImport(context.models.ReferenceData, 'reference');

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
      remote.receive
        .mockResolvedValueOnce({
          records: [{ data }],
          count: 1,
          requestedAt: 1234,
        })
        .mockResolvedValueOnce({
          records: [],
          count: 0,
          requestedAt: 2345,
        });

      // act
      await manager.receiveAndImport(context.models.ReferenceData, channel);

      // assert
      const metadata = await context.models.SyncMetadata.findOne({ where: { channel } });
      expect(metadata.lastSynced).toEqual(1234);
    });
  });
});
