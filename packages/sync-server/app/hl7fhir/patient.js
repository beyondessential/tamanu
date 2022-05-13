import config from 'config';
import { format } from 'date-fns';
import { Op } from 'sequelize';

import {
  stringTypeModifiers,
  getParamAndModifier,
  getQueryObject,
  getDefaultOperator,
  modifiers,
  hl7ParameterTypes,
} from './utils';

function patientName(patient, additional) {
  const official = {
    use: 'official',
    prefix: additional.title ? [additional.title] : [],
    // lastName is not a mandatory field in Tamanu, but is in HL7
    // Some patients genuinely do not have last names, so, just send
    // a preconfigured string in this circumstance.
    family: patient.lastName || config.hl7.nullLastNameValue,
    given: [patient.firstName, patient.middleName].filter(x => x),
  };

  if (!patient.culturalName) {
    return [official];
  }

  return [
    official,
    {
      use: 'nickname',
      text: patient.culturalName,
    },
  ];
}

function patientIds(patient, additional) {
  return [
    {
      use: 'usual',
      value: patient.id,
    },
    {
      use: 'official',
      value: patient.displayId,
      assigner: config.hl7.assigners.patientDisplayId,
      system: config.hl7.dataDictionaries.patientDisplayId,
    },
    {
      use: 'secondary',
      assigner: 'Fiji Passport Office',
      value: additional.passportNumber,
    },
    {
      use: 'secondary',
      assigner: 'RTA',
      value: additional.drivingLicense,
    },
  ].filter(x => x.value);
}

function patientAddress(patient, additional) {
  const { cityTown, streetVillage } = additional;
  if (!cityTown && !streetVillage) return [];
  return [
    {
      type: 'physical',
      use: 'home',
      city: additional.cityTown,
      line: additional.streetVillage ? [additional.streetVillage] : [],
    },
  ];
}

function patientTelecom(patient, additional) {
  return [additional.primaryContactNumber, additional.secondaryContactNumber]
    .filter(x => x)
    .map((value, index) => ({
      rank: index + 1,
      value,
    }));
}

export function patientToHL7Patient(patient, additional) {
  return {
    resourceType: 'Patient',
    active: true, // currently unused in Tamanu, always true
    identifier: patientIds(patient, additional),
    name: patientName(patient, additional),
    birthDate: patient.dateOfBirth && format(patient.dateOfBirth, 'yyyy-MM-dd'),
    gender: patient.sex,
    address: patientAddress(patient, additional),
    telecom: patientTelecom(patient, additional),
  };
}

// HL7 Patient resource mapping to Tamanu.
// (only supported params are in)
const hl7PatientFields = {
  given: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'firstName',
    columnName: 'first_name',
    supportedModifiers: stringTypeModifiers,
  },
  family: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'lastName',
    columnName: 'last_name',
    supportedModifiers: stringTypeModifiers,
  },
  gender: {
    parameterType: hl7ParameterTypes.token,
    fieldName: 'sex',
    columnName: 'sex',
    supportedModifiers: [],
  },
  birthdate: {
    parameterType: hl7ParameterTypes.date,
    fieldName: 'dateOfBirth',
    columnName: 'date_of_birth',
    supportedModifiers: [],
  },
  // TODO: address should match a bunch of other fields
  address: {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'additionalData.cityTown',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
  },
  'address-city': {
    parameterType: hl7ParameterTypes.string,
    fieldName: 'additionalData.cityTown',
    columnName: 'additionalData.city_town',
    supportedModifiers: stringTypeModifiers,
  },
  // TODO: telecom could also be email or other phones
  telecom: {
    parameterType: hl7ParameterTypes.token,
    fieldName: '$additionalData.primary_contact_number$',
    columnName: 'additionalData.primary_contact_number',
    supportedModifiers: [],
  },
};

// Receives query and returns a sequelize where clause.
// Assumes that query already passed validation.
export function getPatientWhereClause(displayId, query = {}) {
  const filters = [];

  // Handle search by ID separately
  if (displayId) {
    filters.push({ displayId });
  }

  // Create a filter for each query param
  Object.entries(query).forEach(([key, value]) => {
    const [parameter, modifier] = getParamAndModifier(key);

    // Ignore adding filters for unknown parameters
    if (parameter in hl7PatientFields === false) {
      return;
    }

    const { fieldName, columnName, parameterType } = hl7PatientFields[parameter];
    const defaultOperator = getDefaultOperator(parameterType);
    const operator = modifier ? modifiers[parameterType][modifier] : defaultOperator;
    const queryObject = getQueryObject(columnName, value, operator, modifier, parameterType);
    filters.push({ [fieldName]: queryObject });
  });

  // Wrap all filters with explicit "AND" if they exist,
  // otherwise return empty object
  return filters.length > 0 ? { [Op.and]: filters } : {};
}
