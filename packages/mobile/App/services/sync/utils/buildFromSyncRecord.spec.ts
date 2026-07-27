import { buildFromSyncRecord } from './buildFromSyncRecord';
import { BaseModel } from '../../../models/BaseModel';
import { SyncRecord } from '../types';

const makeMockModel = (columnNames: string[]): typeof BaseModel =>
  ({
    excludedSyncColumns: [],
    getRepository: () => ({
      metadata: {
        ownColumns: columnNames.map(propertyName => ({ propertyName })),
        relationIds: [],
        ownRelations: [],
      },
    }),
  }) as any;

describe('buildFromSyncRecord', () => {
  const model = makeMockModel(['id', 'name']);

  it('stores a real current datetime string when the record is deleted', () => {
    const records: SyncRecord[] = [
      {
        recordId: 'record_id',
        isDeleted: true,
        data: { id: 'record_id', name: 'Test' },
      } as SyncRecord,
    ];

    const before = new Date();
    const [built] = buildFromSyncRecord(model, records);
    const after = new Date();

    expect(built.deletedAt).not.toBe("datetime('now')");
    expect(built.deletedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    const deletedAt = new Date((built.deletedAt as string).replace(' ', 'T'));
    expect(deletedAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(deletedAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
  });

  it('stores null when the record is not deleted', () => {
    const records: SyncRecord[] = [
      {
        recordId: 'record_id',
        isDeleted: false,
        data: { id: 'record_id', name: 'Test' },
      } as SyncRecord,
    ];

    const [built] = buildFromSyncRecord(model, records);

    expect(built.deletedAt).toBeNull();
  });
});
