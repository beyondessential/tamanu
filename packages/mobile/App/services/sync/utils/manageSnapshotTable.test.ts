import {
  insertSnapshotRecords,
  getSnapshotBatchIds,
  getSnapshotBatchesByIds,
  createSnapshotTable,
  dropSnapshotTable,
} from './manageSnapshotTable';

jest.mock('../../../infra/db', () => ({
  Database: {
    client: {
      query: jest.fn(),
    },
  },
}));

const mockDatabase = require('../../../infra/db').Database;

describe('manageSnapshotTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('insertSnapshotRecords', () => {
    it('should insert records in batches', async () => {
      const records = Array.from({ length: 2500 }, (_, i) => ({ id: i, data: `record-${i}` }));

      await insertSnapshotRecords(records, 1000);

      expect(mockDatabase.client.query).toHaveBeenCalledTimes(3);
      expect(mockDatabase.client.query).toHaveBeenCalledWith(
        'INSERT INTO sync_snapshot (data) VALUES (?)',
        expect.any(Array),
      );
    });

    it('should handle empty records array', async () => {
      await insertSnapshotRecords([], 1000);

      expect(mockDatabase.client.query).not.toHaveBeenCalled();
    });
  });

  describe('getSnapshotBatchIds', () => {
    it('should return batch IDs in order', async () => {
      mockDatabase.client.query.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

      const result = await getSnapshotBatchIds();

      expect(result).toEqual([1, 2, 3]);
      expect(mockDatabase.client.query).toHaveBeenCalledWith(
        'SELECT id FROM sync_snapshot ORDER BY id',
      );
    });
  });

  describe('getSnapshotBatchesByIds', () => {
    it('should return parsed batch data', async () => {
      const testData = [
        { id: 1, name: 'test' },
        { id: 2, name: 'test2' },
      ];
      mockDatabase.client.query.mockResolvedValue([
        { data: JSON.stringify(testData[0]) },
        { data: JSON.stringify(testData[1]) },
      ]);

      const result = await getSnapshotBatchesByIds([1, 2]);

      expect(result).toEqual(testData);
      expect(mockDatabase.client.query).toHaveBeenCalledWith(
        'SELECT data FROM sync_snapshot WHERE id IN (?,?)',
        [1, 2],
      );
    });

    it('should return empty array when no batch found', async () => {
      mockDatabase.client.query.mockResolvedValue([]);

      const result = await getSnapshotBatchesByIds([999]);

      expect(result).toEqual([]);
      expect(mockDatabase.client.query).toHaveBeenCalledWith(
        'SELECT data FROM sync_snapshot WHERE id IN (?)',
        [999],
      );
    });

    it('should return empty array when batchIds is empty', async () => {
      const result = await getSnapshotBatchesByIds([]);

      expect(result).toEqual([]);
      expect(mockDatabase.client.query).not.toHaveBeenCalled();
    });
  });

  describe('createSnapshotTable', () => {
    it('should create table with correct schema', async () => {
      await createSnapshotTable();

      expect(mockDatabase.client.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE sync_snapshot'),
      );
    });

    it('should handle creation errors', async () => {
      mockDatabase.client.query.mockRejectedValueOnce(new Error('Table exists'));

      await expect(createSnapshotTable()).rejects.toThrow('Table exists');
    });
  });

  describe('dropSnapshotTable', () => {
    it('should drop the snapshot table', async () => {
      await dropSnapshotTable();

      expect(mockDatabase.client.query).toHaveBeenCalledWith('DROP TABLE IF EXISTS sync_snapshot');
    });
  });
});
