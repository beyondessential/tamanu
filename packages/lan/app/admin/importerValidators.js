import * as yup from 'yup';
import { ValidationError } from 'yup';

import { PROGRAM_DATA_ELEMENT_TYPE_VALUES } from 'shared/constants';
import { ForeignKeyStore } from './ForeignKeyStore';

const safeIdRegex = /^[A-Za-z0-9-]+$/;
const safeCodeRegex = /^[A-Za-z0-9-.\/]+$/;

const fieldTypes = {
  id: yup.string().matches(safeIdRegex, 'id must not have spaces or punctuation other than -'),
  code: yup
    .string()
    .matches(safeCodeRegex, 'code must not have spaces or punctuation other than -./'),
  name: yup.string().max(255),
};

const baseSchema = yup.object().shape({
  id: fieldTypes.id.required(),
});

const referenceDataSchema = baseSchema.shape({
  type: yup.string().required(),
  code: fieldTypes.code.required(),
  name: yup.string().required(),
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

const facilitySchema = baseSchema.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  division: yup.string(),
  type: yup.string(),
});

const departmentSchema = baseSchema.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  facilityId: yup.string(),
});

const locationSchema = baseSchema.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  facilityId: yup.string(),
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

const jsonString = () => yup.string()
  .test(
    'is-json',
    '${path} is not valid JSON',
    value => {
      if(!value) return true;
      try {
        JSON.parse(value);
        return true;
      } catch(e) {
        return false;
      }
    }
  );

const programDataElementSchema = baseSchema
  .shape({
    indicator: yup.string(),
    type: yup.string().required().oneOf(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
    defaultOptions: jsonString(),
  });

const surveyScreenComponentSchema = baseSchema
  .shape({
    visibilityCriteria: jsonString(),
    validationCriteria: jsonString(),
    config: jsonString(),
    screenIndex: yup.number().required(),
    componentIndex: yup.number().required(),
    options: jsonString(),
    calculation: yup.string(),
    surveyId: yup.string().required(),
    detail: yup.string().max(255),
    dataElementId: yup.string().required(),
  });

const scheduledVaccineSchema = baseSchema
  .shape({
    category: yup.string().required(),
    label: yup.string().required(),
    schedule: yup.string().required(),
    weeksFromBirthDue: yup.number(),
    weeksFromLastVaccinationDue: yup.number(),
    index: yup.number().required(),
    vaccineId: yup.string().required(),
  });

const surveySchema = baseSchema
  .shape({
    surveyType: yup.string().required().oneOf(['programs', 'referral', 'obsolete']),
  });

const validationSchemas = {
  base: baseSchema,
  referenceData: referenceDataSchema,
  patient: patientSchema,
  user: userSchema,
  facility: facilitySchema,
  department: departmentSchema,
  location: locationSchema,
  labTestType: labTestTypeSchema,
  survey: surveySchema,
  surveyScreenComponent: surveyScreenComponentSchema,
  programDataElement: programDataElementSchema,
  scheduledVaccine: scheduledVaccineSchema,
};

// TODO: allow referencedata relations to specify reference data type
// so that for eg a village and facility with the same name don't get confused
const foreignKeySchemas = {
  department: {
    facility: 'facility',
  },
  location: {
    facility: 'facility',
  },
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
