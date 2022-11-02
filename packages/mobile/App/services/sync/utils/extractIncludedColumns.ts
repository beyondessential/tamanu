import { without } from 'lodash';

import { BaseModel } from '../../../models/BaseModel';

/**
 * Extract the columns to include when exporting/importing for a model
 * @param model
 * @returns
 */
export const extractIncludedColumns = (model: typeof BaseModel): string[] => {
  const { metadata } = model.getRepository();

  // find columns to include
  const allColumns = [
    ...metadata.columns,
    ...metadata.relationIds, // typeorm thinks these aren't columns
  ].map(({ propertyName }) => propertyName);
  const includedColumns = without(allColumns, ...model.excludedSyncColumns);

  return includedColumns;
};
