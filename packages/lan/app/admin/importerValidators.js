import * as yup from 'yup';
import { ValidationError } from 'yup';

import { ForeignKeyManager } from './ForeignKeyManager';

const safeIdRegex = /^[A-Za-z0-9-]+$/;
const baseSchema = yup.object()
  .shape({
    id: yup.string().required().matches(safeIdRegex, 'id must not have spaces or punctuation other than -'),
  });

const safeCodeRegex = /^[A-Za-z0-9-.\/]+$/;
const referenceDataSchema = baseSchema
  .shape({
    type: yup.string().required(),
    code: yup.string().required().matches(safeCodeRegex, 'code must not have spaces or punctuation other than -./'),
    name: yup.string().required().max(255),
  });

const patientSchema = baseSchema
  .shape({
    villageId: yup.string(),
  });

const userSchema = baseSchema
  .shape({
    email: yup.string().required(),
    displayName: yup.string().required(),
    password: yup.string().required(),
  });


const LAB_TEST_RESULT_TYPES = ['Number', 'Select', 'FreeText'];
const rangeRegex = /^[0-9.]+, [0-9.]+$/;
const labTestSchema = baseSchema
  .shape({
    name: yup.string().required(),
    categoryId: yup.string().required(),
    resultType: yup.string().required().oneOf(LAB_TEST_RESULT_TYPES),
    options: yup.string(),
    unit: yup.string(),
    maleRange: yup.string().matches(rangeRegex),
    femaleRange: yup.string().matches(rangeRegex),
  });

const validationSchemas = {
  base: baseSchema,
  referenceData: referenceDataSchema,
  patient: patientSchema,
  user: userSchema,
  labTestType: labTestSchema,
};

const foreignKeySchemas = {
  patient: {
    village: 'referenceData',
  },
  labTestType: {
    category: 'referenceData',
  },
};

export async function validateRecordSet(records) {
  const fkManager = new ForeignKeyManager(records);

  const validate = async (record) => {
    const { recordType, data } = record;
    const schema = validationSchemas[recordType] || schemas.base;

    try {
      // perform id duplicate check outside of schemas as it relies on consistent
      // object identities, which yup's validation does not guarantee
      fkManager.assertUniqueId(record);

      // populate all FKs for this data object
      const fkSchema = foreignKeySchemas[recordType] || {};
      fkManager.linkForeignKeys(data, fkSchema);

      const validatedData = await schema.validate(data);

      return {
        ...record,
        data: validatedData,
      };
    } catch(e) {
      if(e.name !== 'ValidationError') throw e;

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
