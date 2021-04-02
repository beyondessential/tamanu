import * as yup from 'yup';
import { ValidationError } from 'yup';

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

const validationSchemas = {
  base: baseSchema,
  referenceData: referenceDataSchema,
  patient: patientSchema,
  user: userSchema,
};

const pairers = {
  patient: (data, findRecordId) => {
    const {
      village,
      ...rest
    } = data;
    if(!village) return data;

    const villageId = findRecordId('referenceData', village, 'name');
    return {
      villageId,
      ...rest
    };
  },
};

const createRecordFinder = (records, recordsById) => (
  recordType,
  search,
  searchField = 'name'
) => {
  // don't run an empty search, if a relation is mandatory
  // it should be set in the schema
  if(!search) return '';

  const byId = recordsById[search];
  if(byId) {
    if(byId.recordType !== recordType) {
      throw new ValidationError(`linked ${recordType} for ${search} was of type ${byId.recordType}`);
    }
    return search;
  }

  const found = records.find(r => {
    if(r.recordType !== recordType || (r.recordType === "referenceData" && r.data.type === recordType)) return false;
    if(r.data[searchField].toLowerCase() === search.toLowerCase()) {
      return true;
    }
  });

  if(found) return found.data.id;
  throw new ValidationError(`could not find a ${recordType} called "${search}"`);
};

export async function validateRecordSet(records) {
  // set up validation context
  const recordsById = records.reduce(
    (all, current) => { 
      const { id } = current.data;
      return {
        ...all,
        [id]: all[id] || current,
      };
    },
    {}
  );

  const findRecordId = createRecordFinder(records, recordsById);

  const validate = async (record) => {
    const { recordType, data } = record;
    const schema = validationSchemas[recordType] || schemas.base;

    try {
      // perform id duplicate check outside of schemas as it relies on consistent
      // object identities, which yup's validation does not guarantee
      const existing = recordsById[data.id];
      if(existing !== record) {
        throw new ValidationError(`id ${data.id} is already being used at ${existing.sheet}:${existing.row}`);
      }

      // populate all FKs for this data object
      const pairer = pairers[recordType] || (data => data);
      const linkedData = pairer(data, findRecordId);

      const validatedData = await schema.validate(linkedData);

      return {
        ...record,
        data: validatedData,
      };
    } catch(e) {
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
