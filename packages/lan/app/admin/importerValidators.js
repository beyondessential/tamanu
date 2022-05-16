import { ValidationError } from 'yup';

import { ForeignKeyStore } from './ForeignKeyStore';
import { schemas } from './importSchemas';

export async function validateRecordSet(records) {
  const fkStore = new ForeignKeyStore(records);

  const validate = async record => {
    const { recordType, data } = record;
    const schema = schemas[recordType] || schemas.base;

    try {
      // perform id duplicate check outside of schemas as it relies on consistent
      // object identities, which yup's validation does not guarantee
      fkStore.assertUniqueId(record);

      // populate all FKs for this data object
      fkStore.linkByForeignKey(record);

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
