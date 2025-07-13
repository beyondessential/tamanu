import { DataToPersist, SyncRecordData } from '../types';
import { BaseModel } from '../../../models/BaseModel';

// Cache for model metadata to avoid repeated expensive computations
const modelMetadataCache = new Map<string, {
  includedColumns: string[];
  fieldMapping: [string, string][];
}>();

const getModelCacheKey = (model: typeof BaseModel): string => {
  return model.name;
};

const getModelMetadata = (model: typeof BaseModel) => {
  const cacheKey = getModelCacheKey(model);
  
  if (modelMetadataCache.has(cacheKey)) {
    return modelMetadataCache.get(cacheKey)!;
  }

  const { metadata } = model.getTransactionalRepository();
  const excludes = model.excludedSyncColumns || [];
  
  // Extract included columns (optimized version of extractIncludedColumns)
  const allColumns = [
    ...metadata.ownColumns,
    ...metadata.relationIds, // typeorm thinks these aren't columns
  ].map(({ propertyName }) => propertyName);
  
  const relationPropertyNames = new Set(metadata.ownRelations.map(r => r.propertyName));
  const excludesSet = new Set(excludes);
  
  const includedColumns = allColumns.filter(column => 
    !relationPropertyNames.has(column) && !excludesSet.has(column)
  );

  // Get relation field mapping (optimized version of getRelationIdsFieldMapping)
  const fieldMapping = metadata.relationIds.map((rid): [string, string] => [
    rid.propertyName,
    rid.relation.propertyName,
  ]);

  const result = { includedColumns, fieldMapping };
  modelMetadataCache.set(cacheKey, result);
  return result;
};

// Optimized native implementation of lodash pick
const pick = (obj: { [key: string]: unknown }, keys: string[]): { [key: string]: unknown } => {
  const result: { [key: string]: unknown } = {};
  const objKeys = Object.keys(obj);
  const keysSet = new Set(keys);
  
  for (const key of objKeys) {
    if (keysSet.has(key)) {
      result[key] = obj[key];
    }
  }
  return result;
};

// Optimized mapFields function to avoid object spreading and deletion
const mapFields = (mapping: [string, string][], obj: { [key: string]: unknown }): DataToPersist => {
  const result: DataToPersist = {};
  const mappingMap = new Map(mapping);
  
  for (const [key, value] of Object.entries(obj)) {
    const mappedKey = mappingMap.get(key);
    if (mappedKey) {
      result[mappedKey] = value;
    } else {
      result[key] = value;
    }
  }
  
  return result;
};

export const buildFromSyncRecord = (
  model: typeof BaseModel,
  data: SyncRecordData,
): DataToPersist => {
  const { includedColumns, fieldMapping } = getModelMetadata(model);
  const pickedData = pick(data, includedColumns);
  const dbRecord = mapFields(fieldMapping, pickedData);
  return dbRecord;
};

// Clear cache when needed (useful for testing or if models change)
export const clearModelMetadataCache = (): void => {
  modelMetadataCache.clear();
};

// Legacy exports for backward compatibility (now using cached versions)
export const getRelationIdsFieldMapping = (model: typeof BaseModel) => {
  const { fieldMapping } = getModelMetadata(model);
  return fieldMapping;
};

export const extractIncludedColumns = (model: typeof BaseModel): string[] => {
  const { includedColumns } = getModelMetadata(model);
  return includedColumns;
};
