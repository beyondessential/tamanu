import { ValidationError } from 'yup';

import { ForeignKeyStore } from './ForeignKeyStore';
import * as schemas from './importSchemas';

const includesRelations = {
  facility: ['department', 'location'],
};

export async function validateRecordSet(records) {
  const fkStore = new ForeignKeyStore(records);

  const validate = async record => {
    const { recordType, recordId, data } = record;
    const { id } = data;
    const schema = schemas[recordType] || schemas.base;

    const lookupValue = recordId || id;

    try {
      if (!lookupValue) {
        throw new ValidationError('record has no id');
      }
      // perform id duplicate check outside of schemas as it relies on
      // consistent object identities, which yup's validation
      // does not guarantee
      const existing = fkStore.recordsObject[lookupValue];
      if (existing !== record) {
        throw new ValidationError(
          `id ${lookupValue} is already being used at ${existing.sheet}:${existing.row}`,
        );
      }

      // populate all FKs for this data object
      fkStore.linkByForeignKey(record);

      // this assumes that the included records has a foreign key field
      // pointing to the parent record
      // i.e. a department record already has a "facilityId" field
      if (includesRelations[recordType]) {
        for (const recordTypeToBeIncluded of includesRelations[recordType]) {
          const foundRecord = fkStore.findRecord(
            lookupValue,
            recordTypeToBeIncluded,
            `${recordType}Id`,
          );
          if (!foundRecord) {
            throw new ValidationError(`record has no ${recordTypeToBeIncluded}`);
          }
        }
      }

      const validatedData = await schema.validate(data);

      return {
        ...record,
        data: validatedData,
      };
    } catch (e) {
      if (!(e instanceof ValidationError)) throw e;

      return {
        ...record,
        errors: e.errors,
      };
    }
  };

  // validate all records and then group them by status
  const validatedRecords = await Promise.all(records.map(validate));
  const goodRecords = validatedRecords.filter(x => !x.errors).filter(x => x);
  const badRecords = validatedRecords.filter(x => x.errors);

  return {
    records: goodRecords,
    errors: badRecords,
  };
}
