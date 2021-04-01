
export const ERRORS = {
  MISSING_ID: 'missingId',
  INVALID_ID: 'invalidId',
  DUPLICATE_ID: 'duplicateId',
  INVALID_CODE: 'invalidCode',
  BAD_FOREIGN_KEY: 'badForeignKey',
  FIELD_TOO_LONG: 'fieldTooLong',
};

const safeIdRegex = /^[A-Za-z0-9-]+$/;
const baseValidator = (record, { recordsById }) => {
  const { id } = record.data;
  if(!id) return { error: ERRORS.MISSING_ID };
  if(!id.match(safeIdRegex)) return { error: ERRORS.INVALID_ID };

  if(recordsById[id] !== record) {
    return {
      error: ERRORS.DUPLICATE_ID,
      duplicateOf: recordsById[id],
    };
  }
};

const safeCodeRegex = /^[A-Za-z0-9-.\/]+$/;
const referenceDataValidator = (record, context) => {
  const base = baseValidator(record, context);
  if(base) return base;

  if(!record.data.code?.match(safeCodeRegex)) {
    return {
      error: ERRORS.INVALID_CODE,
    };
  }

  if(record.data.name.length > 255) {
    return {
      error: ERRORS.FIELD_TOO_LONG,
      field: 'name',
    };
  }
};

const validatorsByRecordType = {
  referenceData: referenceDataValidator
};

export function validate(record, context) {
  const { recordType } = record;
  const validator = validatorsByRecordType[recordType] || baseValidator;
  return {
    ...validator(record, context),
    ...record
  };
}

