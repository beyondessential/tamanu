import {
    assertIfSessionIdIsSafe,
    getSnapshotTableName,
    insertSnapshotRecords,
    getSnapshotBatchIds,
    getSnapshotBatchById,
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
  
    describe('assertIfSessionIdIsSafe', () => {
      it('should accept valid session IDs', () => {
        expect(() => assertIfSessionIdIsSafe('abc123-def456')).not.toThrow();
        expect(() => assertIfSessionIdIsSafe('SESSION-123')).not.toThrow();
        expect(() => assertIfSessionIdIsSafe('test123')).not.toThrow();
      });
  
      it('should reject invalid session IDs', () => {
        expect(() => assertIfSessionIdIsSafe('session@123')).toThrow();
        expect(() => assertIfSessionIdIsSafe('session.123')).toThrow();
        expect(() => assertIfSessionIdIsSafe('session/123')).toThrow();
        expect(() => assertIfSessionIdIsSafe('session 123')).toThrow();
      });
    });
  
    describe('getSnapshotTableName', () => {
      it('should generate correct table name', () => {
        const result = getSnapshotTableName('test-session-123');
        expect(result).toBe('sync_snapshots_test_session_123');
      });
  
      it('should sanitize special characters', () => {
        const result = getSnapshotTableName('test-session-123');
        expect(result).toBe('sync_snapshots_test_session_123');
      });
    });
  
    describe('insertSnapshotRecords', () => {
      it('should insert records in batches', async () => {
        const records = Array.from({ length: 2500 }, (_, i) => ({ id: i, data: `record-${i}` }));
        
        await insertSnapshotRecords('test-session', records);
        
        expect(mockDatabase.client.query).toHaveBeenCalledTimes(3);
        expect(mockDatabase.client.query).toHaveBeenCalledWith(
          'INSERT INTO sync_snapshots_test_session (data) VALUES (?)',
          expect.any(Array)
        );
      });
  
      it('should handle empty records array', async () => {
        await insertSnapshotRecords('test-session', []);
        
        expect(mockDatabase.client.query).not.toHaveBeenCalled();
      });
    });
  
    describe('getSnapshotBatchIds', () => {
      it('should return batch IDs in order', async () => {
        mockDatabase.client.query.mockResolvedValue([
          { id: 1 },
          { id: 2 },
          { id: 3 },
        ]);
  
        const result = await getSnapshotBatchIds('test-session');
        
        expect(result).toEqual([1, 2, 3]);
        expect(mockDatabase.client.query).toHaveBeenCalledWith(
          'SELECT id FROM sync_snapshots_test_session ORDER BY id'
        );
      });
    });
  
    describe('getSnapshotBatchById', () => {
      it('should return parsed batch data', async () => {
        const testData = [{ id: 1, name: 'test' }];
        mockDatabase.client.query.mockResolvedValue([
          { data: JSON.stringify(testData) }
        ]);
  
        const result = await getSnapshotBatchById('test-session', 1);
        
        expect(result).toEqual(testData);
        expect(mockDatabase.client.query).toHaveBeenCalledWith(
          'SELECT data FROM sync_snapshots_test_session WHERE id = ?',
          [1]
        );
      });
  
      it('should return empty array when no batch found', async () => {
        mockDatabase.client.query.mockResolvedValue([]);
  
        const result = await getSnapshotBatchById('test-session', 999);
        
        expect(result).toEqual([]);
      });
    });
  
    describe('createSnapshotTable', () => {
      it('should create table with correct schema', async () => {
        await createSnapshotTable('test-session');
        
        expect(mockDatabase.client.query).toHaveBeenCalledWith(
          expect.stringContaining('CREATE TABLE sync_snapshots_test_session')
        );
      });
  
      it('should handle creation errors', async () => {
        mockDatabase.client.query.mockRejectedValue(new Error('Table exists'));
        
        await expect(createSnapshotTable('test-session')).rejects.toThrow('Table exists');
      });
    });
  
    describe('dropSnapshotTable', () => {
      it('should drop specific table when sessionId provided', async () => {
        await dropSnapshotTable('test-session');
        
        expect(mockDatabase.client.query).toHaveBeenCalledWith(
          expect.stringContaining('DROP TABLE IF EXISTS sync_snapshots_test_session')
        );
      });
  
      it('should drop all snapshot tables when no sessionId', async () => {
        mockDatabase.client.query
          .mockResolvedValueOnce([
            { name: 'sync_snapshots_session_1' },
            { name: 'sync_snapshots_session_2' },
          ])
          .mockResolvedValue(undefined);
  
        await dropSnapshotTable();
        
        expect(mockDatabase.client.query).toHaveBeenCalledWith(
          expect.stringContaining("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'sync_snapshots_%'")
        );
        expect(mockDatabase.client.query).toHaveBeenCalledWith(
          'DROP TABLE IF EXISTS sync_snapshots_session1'
        );
        expect(mockDatabase.client.query).toHaveBeenCalledWith(
          'DROP TABLE IF EXISTS sync_snapshots_session2'
        );
      });
    });
  }); 