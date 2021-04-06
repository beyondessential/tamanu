import * as yup from 'yup';

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

const patientSchema = baseSchema;

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

export async function validateRecordSet(records, options = {}) {
  const {
    trustForeignKeys,
  } = options;

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

  const validate = async (record) => {
    const { recordType, data } = record;
    const schema = validationSchemas[recordType] || schemas.base;

    try {
      await schema.validate(data);
  
      // perform id duplicate check outside of schemas as it relies on consistent
      // object identities, which yup's validation does not guarantee
      const existing = recordsById[data.id];
      if(existing !== record) {
        throw new yup.ValidationError(`id ${data.id} is already being used at ${existing.sheet}:${existing.row}`);
      }

      return record;
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
