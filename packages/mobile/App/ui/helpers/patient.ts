import { IPatientAdditionalData } from '~/types';

export const PATIENT_DATA_FIELDS = {
  FIRST_NAME: 'firstName',
  LAST_NAME: 'lastName',
  DATE_OF_BIRTH: 'dateOfBirth',
  SEX: 'sex',
  CULTURAL_NAME: 'culturalName',
  EMAIL: 'email',
  VILLAGE_ID: 'villageId',
  MIDDLE_NAME: 'middleName',
};

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

export const getConfiguredPatientAdditionalDataFields = (
  fields: string[],
  showMandatory: boolean,
  getSetting: <T>(key: string) => T,
) => {
  const localisedFields = Object.keys(getSetting('localisation.fields'));

  return fields.filter(fieldName => {
    if (localisedFields.includes(fieldName)) {
      const requiredPatientData = getSetting<boolean>(
        `localisation.fields.${fieldName}.requiredPatientData`,
      );
      return !!requiredPatientData === showMandatory;
    }
    return true;
  });
};
