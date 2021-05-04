import * as yup from 'yup';
import { ValidationError } from 'yup';

import { PROGRAM_DATA_ELEMENT_TYPE_VALUES } from 'shared/constants';
import { ForeignKeyStore } from './ForeignKeyStore';

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
    firstName: yup.string().required(),
    lastName: yup.string().required(),
    dateOfBirth: yup.date().required(),
  });

const userSchema = baseSchema
  .shape({
    email: yup.string().required(),
    displayName: yup.string().required(),
    password: yup.string().required(),
  });

const LAB_TEST_RESULT_TYPES = ['Number', 'Select', 'FreeText'];
const rangeRegex = /^[0-9.]+, [0-9.]+$/;
const labTestTypeSchema = baseSchema
  .shape({
    name: yup.string().required(),
    labTestCategoryId: yup.string().required(),
    resultType: yup.string().required().oneOf(LAB_TEST_RESULT_TYPES),
    options: yup.string(),
    unit: yup.string(),
    maleRange: yup.string().matches(rangeRegex),
    femaleRange: yup.string().matches(rangeRegex),
  });

const programDataElementSchema = baseSchema
  .shape({
    indicator: yup.string(),
    type: yup.string().required().oneOf(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
  });

const surveyScreenComponentSchema = baseSchema
  .shape({
    visibilityCriteria: yup.string(),
    validationCriteria: yup.string(),
    config: yup.string(),
    screenIndex: yup.number().required(),
    componentIndex: yup.number().required(),
    options: yup.string(),
    calculation: yup.string(),
    surveyId: yup.string().required(),
    dataElementId: yup.string().required(),
  });

const scheduledVaccineSchema = baseSchema
  .shape({
    category: yup.string().required(),
    label: yup.string().required(),
    schedule: yup.string().required(),
    weeksFromBirthDue: yup.number(),
    index: yup.number().required(),
    vaccineId: yup.string().required(),
  });

const validationSchemas = {
  base: baseSchema,
  referenceData: referenceDataSchema,
  patient: patientSchema,
  user: userSchema,
  labTestType: labTestTypeSchema,
  surveyScreenComponent: surveyScreenComponentSchema,
  programDataElement: programDataElementSchema,
  scheduledVaccine: scheduledVaccineSchema,
};

// TODO: allow referencedata relations to specify reference data type
// so that for eg a village and facility with the same name don't get confused
const foreignKeySchemas = {
  patient: {
    village: 'referenceData',
  },
  labTestType: {
    labTestCategory: 'referenceData',
  },
  scheduledVaccine: {
    vaccine: 'referenceData',
  },
};

class ForeignKeyLinker {
  constructor(fkStore) {
    this.fkStore = fkStore;
  }

  link(record) {
    const { data, recordType } = record; 
    const schema = foreignKeySchemas[recordType];

    if(!schema) return;

    for(const [field, recordType] of Object.entries(schema)) {
      const search = data[field];
      if (!search) continue;
      const found = this.fkStore.findRecord(recordType, search);
      const foundId = found?.data?.id;
      if (!foundId) {
        throw new ValidationError(`matching record from ${found.sheet}:${found.row} has no id`);
      }
      data[`${field}Id`] = foundId;
      delete data[field];
    }
  }
}

export async function validateRecordSet(records) {
  const fkStore = new ForeignKeyStore(records);
  const fkLinker = new ForeignKeyLinker(fkStore);

  const validate = async (record) => {
    const { recordType, data } = record;
    const schema = validationSchemas[recordType] || validationSchemas.base;

    try {
      // perform id duplicate check outside of schemas as it relies on consistent
      // object identities, which yup's validation does not guarantee
      fkStore.assertUniqueId(record);

      // populate all FKs for this data object
      fkLinker.link(record);

      const validatedData = await schema.validate(data);

      return {
        ...record,
        data: validatedData,
      };
    } catch(e) {
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
