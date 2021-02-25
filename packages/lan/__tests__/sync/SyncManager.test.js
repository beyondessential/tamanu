import { Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

import { REFERENCE_TYPES } from 'shared/constants';

import { initDatabase } from '~/database';
import { SyncManager } from '~/sync';
import { WebRemote } from '~/sync/WebRemote';
jest.mock('~/sync/WebRemote');

describe('SyncManager', () => {
  let manager;
  let context;
  const remote = new WebRemote();
  beforeAll(async () => {
    context = await initDatabase();
    manager = new SyncManager(context, remote);
  });

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
        .mockReturnValueOnce(
          Promise.resolve({
            records: [{ data: records[0] }],
            count: 1,
            requestedAt: 1234,
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            records: [{ data: records[1] }],
            count: 1,
            requestedAt: 2345,
          }),
        )
        .mockReturnValueOnce(
          Promise.resolve({
            records: [],
            count: 0,
            requestedAt: 3456,
          }),
        );

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

    it.todo('stores and retrieves the last sync timestamp');
  });
});
