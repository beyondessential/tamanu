import { without } from 'lodash';

import { BaseModel } from '~/models/BaseModel';

/*
 *   extractIncludedColumns
 *
 *    Input: a model
 *    Output: columns to include when exporting/importing that model
 */
export const extractIncludedColumns = (model: typeof BaseModel) => {
    const { metadata } = model.getRepository();
  
    // find columns to include
    const allColumns = [
      ...metadata.columns,
      ...metadata.relationIds, // typeorm thinks these aren't columns
    ].map(({ propertyName }) => propertyName);
    const includedColumns = without(allColumns, ...model.excludedSyncColumns);
  
    return includedColumns;
  };