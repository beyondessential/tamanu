import { extractIncludedColumns } from './extractIncludedColumns';
import type { BaseModel } from '../../../models/BaseModel';

const asMetadataEntries = (propertyNames: string[]) =>
  propertyNames.map(propertyName => ({ propertyName }));

const makeMockModel = ({
  ownColumns,
  relationIds,
  ownRelations,
  excludedSyncColumns,
}: {
  ownColumns: string[];
  relationIds: string[];
  ownRelations: string[];
  excludedSyncColumns: string[];
}): typeof BaseModel =>
  ({
    excludedSyncColumns,
    getRepository: () => ({
      metadata: {
        ownColumns: asMetadataEntries(ownColumns),
        relationIds: asMetadataEntries(relationIds),
        ownRelations: asMetadataEntries(ownRelations),
      },
    }),
  }) as any;

describe('extractIncludedColumns', () => {
  const model = makeMockModel({
    ownColumns: ['id', 'name', 'villageId', 'createdAt', 'updatedAt', 'updatedAtSyncTick'],
    relationIds: ['nationalityId'],
    ownRelations: ['village', 'nationality'],
    excludedSyncColumns: ['createdAt', 'updatedAt', 'updatedAtSyncTick'],
  });

  it('keeps own columns and relation ids, dropping relation objects and excluded sync columns', () => {
    expect(extractIncludedColumns(model)).toEqual(['id', 'name', 'villageId', 'nationalityId']);
  });

  it('uses the passed excluded columns instead of the model’s', () => {
    expect(extractIncludedColumns(model, ['name'])).toEqual([
      'id',
      'villageId',
      'createdAt',
      'updatedAt',
      'updatedAtSyncTick',
      'nationalityId',
    ]);
  });
});
