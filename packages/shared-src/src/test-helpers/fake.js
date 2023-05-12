import { random, sample } from 'lodash';
import Chance from 'chance';
import { DataTypes } from 'sequelize';
import { inspect } from 'util';
import { formatISO9075 } from 'date-fns';

import {
  DIAGNOSIS_CERTAINTY_VALUES,
  ENCOUNTER_TYPE_VALUES,
  IMAGING_REQUEST_STATUS_TYPES,
  NOTE_TYPE_VALUES,
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  REFERENCE_TYPE_VALUES,
  VISIBILITY_STATUSES,
  LAB_REQUEST_STATUSES,
} from '../constants';
import { toDateTimeString, toDateString } from '../utils/dateTime';
import { fakeUUID } from '../utils/generateId';
import {
  FhirAddress,
  FhirAnnotation,
  FhirCodeableConcept,
  FhirCoding,
  FhirContactPoint,
  FhirHumanName,
  FhirIdentifier,
  FhirPatientLink,
  FhirPeriod,
  FhirReference,
  FhirExtension,
  FhirImmunizationPerformer,
  FhirImmunizationProtocolApplied,
} from '../services/fhirTypes';

const chance = new Chance();

export function fakeStringFields(prefix, fields) {
  return fields.reduce(
    (obj, field) => ({
      ...obj,
      [field]: prefix + field,
    }),
    {},
  );
}

export function fakeScheduledVaccine(prefix = 'test-') {
  const id = fakeUUID();
  return {
    weeksFromBirthDue: random(0, 1000),
    weeksFromLastVaccinationDue: null,
    index: random(0, 50),
    vaccineId: null,
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    ...fakeStringFields(`${prefix}scheduledVaccine_${id}_`, [
      'id',
      'category',
      'label',
      'schedule',
    ]),
  };
}

export function fakeSurvey(prefix = 'test-') {
  const id = fakeUUID();
  return {
    programId: null,
    surveyType: 'programs',
    isSensitive: false,
    ...fakeStringFields(`${prefix}survey_${id}_`, ['id', 'code', 'name']),
  };
}

export function fakeSurveyScreenComponent(prefix = 'test-') {
  const id = fakeUUID();
  return {
    surveyId: null,
    dataElementId: null,
    screenIndex: random(0, 100),
    componentIndex: random(0, 100),
    options: '{"foo":"bar"}',
    calculation: '',
    ...fakeStringFields(`${prefix}surveyScreenComponent_${id}_`, [
      'id',
      'text',
      'visibilityCriteria',
      'validationCriteria',
      'detail',
      'config',
    ]),
  };
}

export function fakeProgramDataElement(prefix = 'test-') {
  const id = fakeUUID();
  return {
    type: sample(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
    ...fakeStringFields(`${prefix}programDataElement_${id}_`, [
      'id',
      'code',
      'name',
      'indicator',
      'defaultText',
      'defaultOptions',
    ]),
  };
}

export function fakeReferenceData(prefix = 'test-') {
  const id = fakeUUID();
  return {
    type: sample(REFERENCE_TYPE_VALUES),
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    ...fakeStringFields(`${prefix}referenceData_${id}_`, ['id', 'name', 'code']),
  };
}

export function fakeUser(prefix = 'test-') {
  const id = fakeUUID();
  return fakeStringFields(`${prefix}user_${id}_`, ['id', 'email', 'displayName', 'role']);
}

export function fakeProgram(prefix = 'test-') {
  const id = fakeUUID();
  return fakeStringFields(`${prefix}program_${id})_`, ['id', 'name', 'code']);
}

export function fakeAdministeredVaccine(prefix = 'test-', scheduledVaccineId) {
  const id = fakeUUID();
  return {
    encounterId: null,
    scheduledVaccineId,
    date: formatISO9075(new Date(random(0, Date.now()))),
    ...fakeStringFields(`${prefix}administeredVaccine_${id}_`, ['id', 'batch', 'status', 'reason']),
  };
}

export function fakeEncounter(prefix = 'test-') {
  const id = fakeUUID();
  return {
    deviceId: null,
    surveyResponses: [],
    administeredVaccines: [],
    encounterType: sample(ENCOUNTER_TYPE_VALUES),
    startDate: formatISO9075(new Date(random(0, Date.now()))),
    endDate: formatISO9075(new Date(random(0, Date.now()))),
    ...fakeStringFields(`${prefix}encounter_${id}_`, ['id', 'reasonForEncounter']),
  };
}

export function fakeSurveyResponse(prefix = 'test-') {
  const id = fakeUUID();
  return {
    answers: [],
    encounterId: null,
    surveyId: null,
    startTime: fakeDateTimeString(),
    endTime: fakeDateTimeString(),
    result: Math.random() * 100,
    ...fakeStringFields(`${prefix}surveyResponse_${id}_`, ['id']),
  };
}

export function fakeSurveyResponseAnswer(prefix = 'test-') {
  const id = fakeUUID();
  return {
    dataElementId: null,
    responseId: null,
    ...fakeStringFields(`${prefix}surveyResponseAnswer_${id}_`, ['id', 'name', 'body']),
  };
}

export function fakeEncounterDiagnosis(prefix = 'test-') {
  const id = fakeUUID();
  return {
    certainty: sample(DIAGNOSIS_CERTAINTY_VALUES),
    date: formatISO9075(new Date(random(0, Date.now()))),
    isPrimary: sample([true, false]),
    encounterId: null,
    diagnosisId: null,
    ...fakeStringFields(`${prefix}encounterDiagnosis_${id}_`, ['id']),
  };
}

export function fakeEncounterMedication(prefix = 'test-') {
  const id = fakeUUID();
  return {
    date: formatISO9075(new Date(random(0, Date.now()))),
    endDate: formatISO9075(new Date(random(0, Date.now()))),
    qtyMorning: random(0, 10),
    qtyLunch: random(0, 10),
    qtyEvening: random(0, 10),
    qtyNight: random(0, 10),
    ...fakeStringFields(`${prefix}encounterMedication_${id}_`, [
      'id',
      'prescription',
      'note',
      'indication',
      'route',
    ]),
  };
}

export const fakeDate = () => new Date(random(0, Date.now()));
export const fakeString = (model, { fieldName }, id) => `${model.name}.${fieldName}.${id}`;
export const fakeDateTimeString = () => toDateTimeString(fakeDate());
export const fakeDateString = () => toDateString(fakeDate());
export const fakeInt = () => random(0, 10);
export const fakeFloat = () => Math.random() * 1000;
export const fakeBool = () => sample([true, false]);

const FIELD_HANDLERS = {
  'TIMESTAMP WITH TIME ZONE': fakeDate,
  'TIMESTAMP WITHOUT TIME ZONE': fakeDate,
  DATETIME: fakeDate,
  TIMESTAMP: fakeDate,

  // custom type used for datetime string storage
  date_time_string: fakeDateTimeString,
  DATETIMESTRING: fakeDateTimeString,
  // custom type used for date string storage
  date_string: fakeDateString,
  DATESTRING: fakeDateString,

  'VARCHAR(19)': fakeDateString, // VARCHAR(19) are used for date string storage
  'VARCHAR(255)': fakeString,

  // fallback for all other varchar lengths
  'VARCHAR(N)': (model, attrs, id, length) => fakeString(model, attrs, id).slice(0, length),

  TEXT: fakeString,
  INTEGER: fakeInt,
  FLOAT: fakeFloat,
  DECIMAL: fakeFloat,
  'TINYINT(1)': fakeBool,
  BOOLEAN: fakeBool,
  ENUM: (model, { type }) => sample(type.values),
  UUID: () => fakeUUID(),

  FHIR_ADDRESS: (...args) => FhirAddress.fake(...args),
  FHIR_ANNOTATION: (...args) => FhirAnnotation.fake(...args),
  FHIR_CODEABLE_CONCEPT: (...args) => FhirCodeableConcept.fake(...args),
  FHIR_CODING: (...args) => FhirCoding.fake(...args),
  FHIR_CONTACT_POINT: (...args) => FhirContactPoint.fake(...args),
  FHIR_HUMAN_NAME: (...args) => FhirHumanName.fake(...args),
  FHIR_IDENTIFIER: (...args) => FhirIdentifier.fake(...args),
  FHIR_PATIENT_LINK: (...args) => FhirPatientLink.fake(...args),
  FHIR_PERIOD: (...args) => FhirPeriod.fake(...args),
  FHIR_REFERENCE: (...args) => FhirReference.fake(...args),
  FHIR_EXTENSION: (...args) => FhirExtension.fake(...args),
  FHIR_IMMUNIZATION_PERFORMER: (...args) => FhirImmunizationPerformer.fake(...args),
  FHIR_IMMUNIZATION_PROTOCOL_APPLIED: (...args) => FhirImmunizationProtocolApplied.fake(...args),
};

const IGNORED_FIELDS = ['createdAt', 'updatedAt', 'deletedAt', 'updatedAtSyncTick'];

const MODEL_SPECIFIC_OVERRIDES = {
  Facility: () => ({
    email: chance.email(),
    contactNumber: chance.phone(),
    streetAddress: `${chance.natural({ max: 999 })} ${chance.street()}`,
    cityTown: chance.city(),
    division: chance.province({ full: true }),
    type: chance.pickone(['hospital', 'clinic']),
  }),
  ImagingRequest: () => {
    const status = chance.pickone(Object.values(IMAGING_REQUEST_STATUS_TYPES));
    const isCancelled = status === IMAGING_REQUEST_STATUS_TYPES.CANCELLED;
    return {
      status,
      reasonForCancellation: isCancelled ? chance.pickone(['duplicate', 'entered-in-error']) : null,
    };
  },
  LabRequest: () => {
    const status = chance.pickone(Object.values(LAB_REQUEST_STATUSES));
    const isCancelled = status === LAB_REQUEST_STATUSES.CANCELLED;
    return {
      status,
      reasonForCancellation: isCancelled ? chance.pickone(['duplicate', 'entered-in-error']) : null,
    };
  },
  Patient: () => {
    const sex = chance.pickone(['male', 'female', 'other']);
    let nameGender;
    if (sex === 'male' || sex === 'female') {
      nameGender = sex;
    }
    return {
      displayId: chance.hash({ length: 8 }),
      sex,
      firstName: chance.first({ gender: nameGender }),
      middleName: chance.first({ gender: nameGender }),
      lastName: chance.last(),
      culturalName: chance.first({ gender: nameGender }),
      dateOfDeath: null,
      email: chance.email(),
    };
  },
  PatientAdditionalData: ({ id, patientId }) => {
    const commonId = id || patientId || fakeUUID();
    return {
      id: commonId,
      patientId: commonId,
      placeOfBirth: chance.city(),
      bloodType: chance.pickone(['O', 'A', 'B', 'AB']) + chance.pickone(['+', '-']),
      primaryContactNumber: chance.phone(),
      secondaryContactNumber: chance.phone(),
      maritalStatus: chance.pickone([
        'Single',
        'Married',
        'Widowed',
        'Divorced',
        'Separated',
        'De Facto',
      ]),
      cityTown: chance.city(),
      streetVillage: chance.street(),
      educationalLevel: chance.pickone([
        'None',
        'Primary',
        'High School',
        'Bachelors',
        'Masters',
        'PhD.',
      ]),
      socialMedia: `@${chance.word()}`,
      title: chance.prefix(),
      birthCertificate: `BC${chance.natural({ min: 1000000, max: 9999999 })}`,
      drivingLicense: `L${chance.natural({ min: 100000, max: 999999 })}`,
      passport: chance.character() + chance.natural({ min: 10000000, max: 99999999 }).toString(),
      emergencyContactName: chance.name(),
      emergencyContactNumber: chance.phone(),
      updatedAtByField: {},
    };
  },
  PatientFacility: ({ patientId = fakeUUID(), facilityId = fakeUUID() }) => {
    return {
      id: `${patientId};${facilityId}`,
      patientId,
      facilityId,
    };
  },
  PatientDeathData: () => {
    const options = ['yes', 'no', 'unknown', null];
    return {
      wasPregnant: sample(options),
      pregnancyContributed: sample(options),
      recentSurgery: sample(options),
      stillborn: sample(options),
    };
  },
  User: () => ({
    email: chance.email(),
    displayName: chance.name(),
    role: 'practitioner',
  }),
  Survey: () => ({
    isSensitive: false,
  }),
  Encounter: () => ({
    encounterType: sample(ENCOUNTER_TYPE_VALUES),
  }),
  NotePage: () => ({
    // This is a hack because the type of NotePage.id is UUID, whereas tests might create ids of the form:
    // NotePage.id.123e4567-e89b-12d3-a456-426614174000
    // Setting id: undefined allows the model to create a default uuid and therefore avoid erroring
    // It will be fixed properly as part of EPI-160
    id: undefined,
    noteType: chance.pickone(NOTE_TYPE_VALUES),
  }),
  NoteItem: () => ({
    id: undefined,
  }),
  Location: () => ({
    maxOccupancy: 1,
  }),
};

export const fake = (model, passedOverrides = {}) => {
  const id = fakeUUID();
  const record = {};
  const modelOverridesFn = MODEL_SPECIFIC_OVERRIDES[model.name];
  const modelOverrides = modelOverridesFn ? modelOverridesFn(passedOverrides) : {};
  const overrides = { ...modelOverrides, ...passedOverrides };
  const overrideFields = Object.keys(overrides);

  function fakeField(name, attribute) {
    const { type, fieldName } = attribute;

    if (overrideFields.includes(fieldName)) {
      return overrides[fieldName];
    }

    if (attribute.references) {
      // null out id fields
      return null;
    }

    if (IGNORED_FIELDS.includes(fieldName)) {
      // ignore metadata fields
      return undefined;
    }

    if (fieldName === 'id') {
      return fakeUUID();
    }

    if (fieldName === 'visibilityStatus') {
      return VISIBILITY_STATUSES.CURRENT;
    }

    if (FIELD_HANDLERS[type]) {
      return FIELD_HANDLERS[type](model, attribute, id);
    }

    if (type.type && FIELD_HANDLERS[type.type]) {
      return FIELD_HANDLERS[type.type](model, attribute, id);
    }

    if (type instanceof DataTypes.ARRAY && type.options.type) {
      return Array(random(0, 3))
        .fill(0)
        .map(() => fakeField(name, { ...attribute, type: type.options.type }));
    }

    if (type instanceof DataTypes.STRING && type.options.length) {
      return FIELD_HANDLERS['VARCHAR(N)'](model, attribute, id, type.options.length);
    }

    // if you hit this error, you probably need to add a new field handler or a model-specific override
    throw new Error(
      `Could not fake field ${model.name}.${name} of type ${type} / ${type.type} / ${inspect(
        type,
      )}`,
    );
  }

  for (const [name, attribute] of Object.entries(model.tableAttributes)) {
    const fakeValue = fakeField(name, attribute);
    if (fakeValue !== undefined) record[name] = fakeValue;
  }

  return record;
};
