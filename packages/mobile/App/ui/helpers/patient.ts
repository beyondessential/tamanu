import { IPatientAdditionalData } from '~/types';

export enum VaccineStatus {
  UNKNOWN = 'UNKNOWN',
  GIVEN = 'GIVEN',
  NOT_GIVEN = 'NOT_GIVEN',
  SCHEDULED = 'SCHEDULED',
  MISSED = 'MISSED',
  DUE = 'DUE',
  UPCOMING = 'UPCOMING',
  OVERDUE = 'OVERDUE',
  RECORDED_IN_ERROR = 'RECORDED_IN_ERROR',
  HISTORICAL = 'HISTORICAL',
}

export enum VaccineCategory {
  CAMPAIGN = 'Campaign',
  CATCHUP = 'Catchup',
  ROUTINE = 'Routine',
  OTHER = 'Other',
}

const generators = {
  A: (): string => String.fromCharCode(65 + Math.floor(Math.random() * 26)),
  0: (): string => Math.floor(Math.random() * 10).toFixed(0),
};

function createIdGenerator(format): () => {} {
  const generatorPattern = Array.from(format).map(
    (char: string) => generators[char] || ((): string => ''),
  );

  return (): string => generatorPattern.map(generator => generator()).join('');
}

export const generateId = createIdGenerator('AAAA000000');

export const getFieldData = (data: IPatientAdditionalData, fieldName: string): string => {
  // Field is reference data
  if (fieldName.slice(-2) === 'Id') {
    const actualName = fieldName.slice(0, -2);
    return data?.[actualName]?.name;
  }

  // Field is a string field
  return data?.[fieldName];
};

export const getConfiguredPatientAdditionalDataFields = (fields, showMandatory, getBool) => {
  return fields.filter(fieldName => {
    const requiredPatientData = getBool(`fields.${fieldName}.requiredPatientData`);
    return !!requiredPatientData === showMandatory;
  });
};
