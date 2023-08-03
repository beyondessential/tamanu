import { snakeCase } from 'lodash';
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
  FhirContactPoint,
  FhirHumanName,
  FhirIdentifier,
  FhirPatientLink,
  FhirReference,
  FhirExtension,
  FhirImmunizationPerformer,
  FhirImmunizationProtocolApplied,
} from '../services/fhirTypes';

// this file is most commonly used within tests, but also outside them
// jest wom't always be defined, in which case we can use a random seed
export const chance = new Chance(global.jest ? jest.getSeed() : null);

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
    weeksFromBirthDue: chance.integer({ min: 0, max: 1000 }),
    weeksFromLastVaccinationDue: null,
    index: chance.integer({ min: 0, max: 50 }),
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
    screenIndex: chance.integer({ min: 0, max: 100 }),
    componentIndex: chance.integer({ min: 0, max: 100 }),
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
    type: chance.pickone(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
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
    type: chance.pickone(REFERENCE_TYPE_VALUES),
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    ...fakeStringFields(`${prefix}referenceData_${id}_`, ['id', 'name', 'code']),
  };
}

export function fakeUser(prefix = 'test-') {
  const id = fakeUUID();
  return fakeStringFields(`${prefix}user_${id}_`, [
    'id',
    'displayId',
    'email',
    'displayName',
    'role',
  ]);
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
    date: formatISO9075(chance.date()),
    ...fakeStringFields(`${prefix}administeredVaccine_${id}_`, ['id', 'batch', 'status', 'reason']),
  };
}

export function fakeEncounter(prefix = 'test-') {
  const id = fakeUUID();
  return {
    deviceId: null,
    surveyResponses: [],
    administeredVaccines: [],
    encounterType: chance.pickone(ENCOUNTER_TYPE_VALUES),
    startDate: formatISO9075(chance.date()),
    endDate: formatISO9075(chance.date()),
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
    result: chance.floating({ min: 0, max: 100 }),
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
    certainty: chance.pickone(DIAGNOSIS_CERTAINTY_VALUES),
    date: formatISO9075(chance.date()),
    isPrimary: chance.bool(),
    encounterId: null,
    diagnosisId: null,
    ...fakeStringFields(`${prefix}encounterDiagnosis_${id}_`, ['id']),
  };
}

export function fakeEncounterMedication(prefix = 'test-') {
  const id = fakeUUID();
  return {
    date: formatISO9075(chance.date()),
    endDate: formatISO9075(chance.date()),
    qtyMorning: chance.integer({ min: 0, max: 10 }),
    qtyLunch: chance.integer({ min: 0, max: 10 }),
    qtyEvening: chance.integer({ min: 0, max: 10 }),
    qtyNight: chance.integer({ min: 0, max: 10 }),
    ...fakeStringFields(`${prefix}encounterMedication_${id}_`, [
      'id',
      'prescription',
      'note',
      'indication',
      'route',
    ]),
  };
}

export const fakeDate = () => chance.date();
export const fakeString = (model, { fieldName }, id) => `${model.name}.${fieldName}.${id}`;
export const fakeDateTimeString = () => toDateTimeString(fakeDate());
export const fakeDateString = () => toDateString(fakeDate());
export const fakeInt = () => chance.integer({ min: 0, max: 10 });
export const fakeFloat = () => chance.floating({ min: 0, max: 1000 });
export const fakeBool = () => chance.bool();

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
  ENUM: (model, { type }) => chance.pickone(type.values),
  UUID: () => fakeUUID(),
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
      wasPregnant: chance.pickone(options),
      pregnancyContributed: chance.pickone(options),
      recentSurgery: chance.pickone(options),
      stillborn: chance.pickone(options),
    };
  },
  User: () => ({
    email: chance.email(),
    displayId: chance.hash({ length: 5 }),
    displayName: chance.name(),
    role: 'practitioner',
  }),
  Role: () => ({
    name: `${snakeCase(chance.profession())}_${chance.hash({ length: 8 })}`,
  }),
  Survey: () => ({
    isSensitive: false,
  }),
  Encounter: () => ({
    encounterType: chance.pickone(ENCOUNTER_TYPE_VALUES),
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

const FHIR_MODELS_HANDLERS = {
  FhirPatient: {
    identifier: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    name: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirHumanName.fake(...args)),
    telecom: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirContactPoint.fake(...args)),
    address: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirAddress.fake(...args)),
    link: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirPatientLink.fake(...args)),
    extension: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirExtension.fake(...args)),
  },
  FhirServiceRequest: {
    identifier: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    category: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    order_detail: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    location_code: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    code: (...args) => FhirCodeableConcept.fake(...args),
    subject: (...args) => FhirReference.fake(...args),
    requester: (...args) => FhirReference.fake(...args),
  },
  FhirDiagnosticReport: {
    extension: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirExtension.fake(...args)),
    identifier: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    code: (...args) => FhirCodeableConcept.fake(...args),
    subject: (...args) => FhirReference.fake(...args),
    performer: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
    result: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
  },
  FhirImmunization: {
    vaccine_code: (...args) => FhirCodeableConcept.fake(...args),
    patient: (...args) => FhirReference.fake(...args),
    encounter: (...args) => FhirReference.fake(...args),
    site: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    performer: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirImmunizationPerformer.fake(...args)),
    protocol_applied: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirImmunizationProtocolApplied.fake(...args)),
  },
  FhirImagingStudy: {
    identifier: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    basedOn: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
    note: (...args) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirAnnotation.fake(...args)),
  },
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

    if (type instanceof DataTypes.ARRAY && type.type) {
      return Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => fakeField(name, { ...attribute, type: type.type }));
    }

    if (FIELD_HANDLERS[type]) {
      return FIELD_HANDLERS[type](model, attribute, id);
    }

    if (type.type && FIELD_HANDLERS[type.type]) {
      return FIELD_HANDLERS[type.type](model, attribute, id);
    }

    if (type instanceof DataTypes.STRING && type.options.length) {
      return FIELD_HANDLERS['VARCHAR(N)'](model, attribute, id, type.options.length);
    }

    if (type instanceof DataTypes.JSONB && FHIR_MODELS_HANDLERS[model.name][fieldName]) {
      return FHIR_MODELS_HANDLERS[model.name][fieldName](model, attribute, id);
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
