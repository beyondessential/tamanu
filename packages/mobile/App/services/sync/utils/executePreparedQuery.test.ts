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

    it('falls back to repository.insert when raw query fails', async () => {
      const repository = makeRepository();
      repository.query.mockRejectedValue(new Error('raw insert failed'));
      const rows = [
        { id: '1', name: 'Dog Man', deletedAt: null },
        { id: '2', name: 'Muffin Man', deletedAt: null },
      ];

      await executePreparedInsert(repository, rows as any, 500, progress);

      expect(repository.insert).toHaveBeenCalledTimes(2);
      expect(repository.insert).toHaveBeenNthCalledWith(1, rows[0]);
      expect(repository.insert).toHaveBeenNthCalledWith(2, rows[1]);
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

    it('falls back to repository.update when raw query fails', async () => {
      const repository = makeRepository();
      repository.query.mockRejectedValue(new Error('raw update failed'));
      const rows = [
        { id: '1', name: 'Dog Man', deletedAt: null },
        { id: '2', name: 'Muffin Man', deletedAt: null },
      ];

      await executePreparedUpdate(repository, rows as any, 500, progress);

      expect(repository.update).toHaveBeenCalledTimes(2);
      expect(repository.update).toHaveBeenNthCalledWith(1, { id: '1' }, rows[0]);
      expect(repository.update).toHaveBeenNthCalledWith(2, { id: '2' }, rows[1]);
    });
  });
});
