import { executePreparedInsert, executePreparedUpdate } from './executePreparedQuery';
import { getEffectiveBatchSize } from '../../../infra/db/limits';

jest.mock('../../../infra/db/limits', () => ({
  getEffectiveBatchSize: jest.fn(() => 2),
}));

const makeRepository = () => {
  const repository: any = {
    metadata: { tableName: 'test_table' },
    query: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  };
  return repository;
};

const progress = jest.fn();

describe('executePreparedQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executePreparedInsert', () => {
    it('inserts rows in batches with correct params', async () => {
      const repository = makeRepository();
      const deletedDate = new Date().toISOString();
      const rows = [
        { id: '1', name: 'Dog Man', deletedAt: null },
        { id: '2', name: 'Muffin Man', deletedAt: deletedDate },
      ];

      await executePreparedInsert(repository, rows as any, 500, progress);

      expect(repository.query).toHaveBeenCalledTimes(1);
      const [sql, params] = repository.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO test_table');
      expect(sql).toContain('"id"');
      expect(sql).toContain('"name"');
      expect(sql).toContain('"deletedAt"');
      expect(sql).toContain('VALUES (?, ?, ?), (?, ?, ?)');
      expect(params).toEqual(['1', 'Dog Man', null, '2', 'Muffin Man', deletedDate]);
      expect(repository.insert).not.toHaveBeenCalled();
      expect(progress).toHaveBeenCalledWith(2);
      expect(getEffectiveBatchSize).toHaveBeenCalledWith(500, 3);
    });

    it('falls back to per-row raw insert when the batch query fails', async () => {
      const repository = makeRepository();
      // Batch insert rejects, per-row inserts succeed.
      repository.query
        .mockRejectedValueOnce(new Error('batch insert failed'))
        .mockResolvedValue(undefined);
      const rows = [
        { id: '1', name: 'Dog Man', deletedAt: null },
        { id: '2', name: 'Muffin Man', deletedAt: null },
      ];

      await executePreparedInsert(repository, rows as any, 500, progress);

      // 1 batch attempt + 2 per-row inserts, all via raw query (never repository.insert)
      expect(repository.query).toHaveBeenCalledTimes(3);
      const [row1Sql, row1Params] = repository.query.mock.calls[1];
      expect(row1Sql).toContain('INSERT INTO "test_table"');
      expect(row1Sql).toContain('VALUES (?, ?, ?)');
      expect(row1Params).toEqual(['1', 'Dog Man', null]);
      expect(repository.query.mock.calls[2][1]).toEqual(['2', 'Muffin Man', null]);
      expect(repository.insert).not.toHaveBeenCalled();
    });

    it('throws with the recordId when a per-row insert fails', async () => {
      const repository = makeRepository();
      repository.query
        .mockRejectedValueOnce(new Error('batch insert failed'))
        .mockRejectedValueOnce(new Error('UNIQUE constraint failed'));
      const rows = [{ id: 'rec-1', name: 'Dog Man', deletedAt: null }];

      await expect(executePreparedInsert(repository, rows as any, 500, progress)).rejects.toThrow(
        "Insert failed with 'UNIQUE constraint failed', recordId: rec-1",
      );
    });
  });

  describe('executePreparedUpdate', () => {
    it('updates rows in batches with correct params', async () => {
      const repository = makeRepository();
      const deletedDate = new Date().toISOString();
      const rows = [
        { id: '1', name: 'Dog Man', deletedAt: null },
        { id: '2', name: 'Muffin Man', deletedAt: deletedDate },
      ];

      await executePreparedUpdate(repository, rows as any, 500, progress);

      expect(repository.query).toHaveBeenCalledTimes(1);
      const [sql, params] = repository.query.mock.calls[0];
      expect(sql).toContain('UPDATE test_table SET');
      expect(sql).toContain('WITH updates (');
      expect(sql).toContain('"name"');
      expect(sql).toContain('"deletedAt"');
      // parameter order: id then updatable columns per row
      expect(params).toEqual(['1', 'Dog Man', null, '2', 'Muffin Man', deletedDate]);
      expect(repository.update).not.toHaveBeenCalled();
      expect(progress).toHaveBeenCalledWith(2);
      expect(getEffectiveBatchSize).toHaveBeenCalledWith(500, 3);
    });

    it('skips rows with no updatable columns instead of emitting invalid SQL', async () => {
      const repository = makeRepository();
      const rows = [{ id: 'only-id' }];

      await executePreparedUpdate(repository, rows as any, 500, progress);

      expect(repository.query).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
      expect(progress).toHaveBeenCalledWith(1);
    });

    it('falls back to per-row raw update when the batch query fails', async () => {
      const repository = makeRepository();
      // Batch update rejects, per-row updates succeed.
      repository.query
        .mockRejectedValueOnce(new Error('batch update failed'))
        .mockResolvedValue(undefined);
      const rows = [
        { id: '1', name: 'Dog Man', deletedAt: null },
        { id: '2', name: 'Muffin Man', deletedAt: null },
      ];

      await executePreparedUpdate(repository, rows as any, 500, progress);

      // 1 batch attempt + 2 per-row updates, all via raw query (never repository.update)
      expect(repository.query).toHaveBeenCalledTimes(3);
      const [row1Sql, row1Params] = repository.query.mock.calls[1];
      expect(row1Sql).toContain('UPDATE "test_table" SET');
      expect(row1Sql).toContain('WHERE id = ?');
      // updatable columns first, then id
      expect(row1Params).toEqual(['Dog Man', null, '1']);
      expect(repository.query.mock.calls[2][1]).toEqual(['Muffin Man', null, '2']);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });
});
