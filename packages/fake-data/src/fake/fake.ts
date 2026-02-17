import { randomInt } from 'crypto';
import { isFunction, snakeCase } from 'lodash';
import Chance from 'chance';
import Sequelize, { DataTypes } from 'sequelize';
import { inspect } from 'util';
import { formatISO9075 } from 'date-fns';

import {
  ADMINISTRATION_FREQUENCIES,
  CURRENTLY_AT_TYPES,
  DAYS_OF_WEEK,
  DIAGNOSIS_CERTAINTY_VALUES,
  ENCOUNTER_TYPE_VALUES,
  IMAGING_REQUEST_STATUS_TYPES,
  LAB_REQUEST_STATUSES,
  NOTE_TYPE_VALUES,
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  REFERENCE_TYPE_VALUES,
  REGISTRATION_STATUSES,
  REPEAT_FREQUENCY,
  REPEAT_FREQUENCY_VALUES,
  VISIBILITY_STATUSES,
} from '@tamanu/constants';
import { toDateString, toDateTimeString } from '@tamanu/utils/dateTime';
import { fakeUUID } from '@tamanu/utils/generateId';
import {
  FhirAddress,
  FhirAnnotation,
  FhirCodeableConcept,
  FhirContactPoint,
  FhirExtension,
  FhirHumanName,
  FhirIdentifier,
  FhirImmunizationPerformer,
  FhirImmunizationProtocolApplied,
  FhirPatientLink,
  FhirReference,
} from '@tamanu/shared/services/fhirTypes';
import { Model } from '@tamanu/database/models/Model';

// this file is most commonly used within tests, but also outside them
// jest won't always be defined, in which case we can use a random seed
export const chance = new Chance(global.jest?.getSeed() ?? randomInt(2 ** 42));

export function fakeStringFields(prefix: string, fields: string[]) {
  return fields.reduce(
    (obj: Record<string, string>, field: string) => ({
      ...obj,
      [field]: prefix + field,
    }),
    {},
  );
}

export function fakeScheduledVaccine(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    weeksFromBirthDue: chance.integer({ min: 0, max: 1000 }),
    weeksFromLastVaccinationDue: null,
    index: chance.integer({ min: 0, max: 50 }),
    vaccineId: null,
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    sortIndex: 0,
    ...fakeStringFields(`${prefix}scheduledVaccine_${id}_`, [
      'id',
      'category',
      'label',
      'doseLabel',
    ]),
  };
}

export function fakeSurvey(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    programId: null,
    surveyType: 'programs',
    isSensitive: false,
    ...fakeStringFields(`${prefix}survey_${id}_`, ['id', 'code', 'name']),
  };
}

export function fakeSurveyScreenComponent(prefix: string = 'test-') {
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

export function fakeProgramDataElement(prefix: string = 'test-') {
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

export function fakeReferenceData(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    type: chance.pickone(REFERENCE_TYPE_VALUES),
    visibilityStatus: VISIBILITY_STATUSES.CURRENT,
    ...fakeStringFields(`${prefix}referenceData_${id}_`, ['id', 'name', 'code']),
  };
}

export function fakeUser(prefix: string = 'test-') {
  const id = fakeUUID();
  return fakeStringFields(`${prefix}user_${id}_`, [
    'id',
    'displayId',
    'email',
    'displayName',
    'role',
  ]);
}

export function fakeProgram(prefix: string = 'test-') {
  const id = fakeUUID();
  return fakeStringFields(`${prefix}program_${id})_`, ['id', 'name', 'code']);
}

export function fakeAdministeredVaccine(prefix: string = 'test-', scheduledVaccineId) {
  const id = fakeUUID();
  return {
    encounterId: null,
    scheduledVaccineId,
    date: formatISO9075(chance.date()),
    ...fakeStringFields(`${prefix}administeredVaccine_${id}_`, ['id', 'batch', 'status', 'reason']),
  };
}

export function fakeEncounter(prefix: string = 'test-') {
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

export function fakeSurveyResponse(prefix: string = 'test-') {
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

export function fakeSurveyResponseAnswer(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    dataElementId: null,
    responseId: null,
    ...fakeStringFields(`${prefix}surveyResponseAnswer_${id}_`, ['id', 'name', 'body']),
  };
}

export function fakeEncounterDiagnosis(prefix: string = 'test-') {
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

export function fakePrescription(prefix: string = 'test-') {
  const id = fakeUUID();
  return {
    date: formatISO9075(chance.date()),
    endDate: formatISO9075(chance.date()),
    ...fakeStringFields(`${prefix}prescription${id}_`, ['id', 'note', 'indication', 'route']),
  };
}

export const fakeDate = () => chance.date();
export const fakeString = (model: typeof Model, { fieldName }, id: string) =>
  `${model.name}.${fieldName}.${id}`;
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
  'VARCHAR(N)': (model: typeof Model, attrs: any, id: string, length: number) =>
    fakeString(model, attrs, id).slice(0, length),

  TEXT: fakeString,
  INTEGER: fakeInt,
  FLOAT: fakeFloat,
  DECIMAL: fakeFloat,
  'TINYINT(1)': fakeBool,
  BOOLEAN: fakeBool,
  ENUM: (_, { type }) => chance.pickone(type.values),
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
  LabTestType: () => {
    return {
      code: chance.word(),
      name: chance.word(),
      unit: chance.pickone(['mmol/L', 'umol/L', 'IU']),
      isSensitive: false,
      externalCode: chance.pickone([chance.word(), null]), // sometimes external code not mapped
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
    const nameGender: 'male' | 'female' =
      sex === 'male' || sex === 'female' ? sex : chance.pickone(['male', 'female']);
    return {
      displayId: chance
        .hash({ length: 4 })
        .toUpperCase()
        .concat(chance.integer({ min: 10000000, max: 99999999 }).toString()),
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
      secondaryVillageId: null,
      updatedAtByField: null, // this is to allow the trigger to properly populate it
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
  PatientProgramRegistration: ({ patientId, programRegistryId }) => ({
    id: `${patientId.replaceAll(';', ':')};${programRegistryId.replaceAll(';', ':')}`,
    registrationStatus: REGISTRATION_STATUSES.ACTIVE,
  }),
  Prescription: () => ({
    frequency: chance.pickone(Object.values(ADMINISTRATION_FREQUENCIES)),
    discontinued: false,
    endDate: null,
    idealTimes: null,
  }),
  User: () => ({
    email: chance.email({ length: 20 }),
    displayId: chance.hash({ length: 5 }),
    displayName: chance.name(),
    role: 'practitioner',
  }),
  ReferenceData: () => ({
    type: chance.pickone(REFERENCE_TYPE_VALUES),
  }),
  Role: () => ({
    name: `${snakeCase(chance.profession())}_${chance.hash({ length: 8 })}`,
  }),
  Survey: () => ({
    isSensitive: false,
    notifyEmailAddresses: [],
  }),
  SurveyScreenComponent: () => ({
    calculation: null,
    visibilityCriteria: null,
    config: null,
    options: null,
  }),
  Encounter: () => ({
    encounterType: chance.pickone(ENCOUNTER_TYPE_VALUES),
  }),
  Note: () => ({
    // This is a hack because the type of Note.id is UUID, whereas tests might create ids of the form:
    // Note.id.123e4567-e89b-12d3-a456-426614174000
    // Setting id: undefined allows the model to create a default uuid and therefore avoid erroring
    // It will be fixed properly as part of EPI-160
    id: undefined,
    noteTypeId: chance.pickone(NOTE_TYPE_VALUES),
    revisedById: undefined,
  }),
  Location: () => ({
    maxOccupancy: 1,
  }),
  ProgramRegistry: () => ({
    currentlyAtType: chance.pickone(Object.values(CURRENTLY_AT_TYPES)),
  }),
  AppointmentSchedule: () => {
    const frequency = chance.pickone(REPEAT_FREQUENCY_VALUES);
    const endsMode = chance.pickone(['on', 'after']);
    return {
      frequency,
      daysOfWeek: [chance.pickone(DAYS_OF_WEEK)],
      nthWeekday:
        frequency === REPEAT_FREQUENCY.MONTHLY ? chance.integer({ min: -1, max: 4 }) : null,
      ...(endsMode === 'on'
        ? { untilDate: fakeDateTimeString() }
        : { occurrenceCount: chance.integer({ min: 1, max: 99 }) }),
    };
  },
  ChangeLog: () => ({
    recordId: fakeUUID(),
    id: fakeUUID(),
    tableOid: chance.integer({ min: 10000, max: 99999 }),
    tableSchema: chance.pickone(['public', 'fhir', 'logs']),
    tableName: chance.pickone(['patients', 'encounters', 'lab_requests']),
    loggedAt: fakeDateTimeString(),
    recordCreatedAt: fakeDateTimeString(),
    recordUpdatedAt: fakeDateTimeString(),
    updatedByUserId: fakeUUID(),
    recordUpdate: true,
  }),
};

const FHIR_MODELS_HANDLERS = {
  FhirPatient: {
    identifier: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    name: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirHumanName.fake(...args)),
    telecom: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirContactPoint.fake(...args)),
    address: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirAddress.fake(...args)),
    link: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirPatientLink.fake(...args)),
    extension: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirExtension.fake(...args)),
  },
  FhirServiceRequest: {
    identifier: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    category: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    order_detail: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    location_code: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    subject: (...args: any[]) => FhirReference.fake(...args),
    requester: (...args: any[]) => FhirReference.fake(...args),
  },
  FhirDiagnosticReport: {
    extension: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirExtension.fake(...args)),
    identifier: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    subject: (...args: any[]) => FhirReference.fake(...args),
    performer: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
    result: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
  },
  FhirImmunization: {
    vaccine_code: (...args: any[]) => FhirCodeableConcept.fake(...args),
    patient: (...args: any[]) => FhirReference.fake(...args),
    encounter: (...args: any[]) => FhirReference.fake(...args),
    site: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirCodeableConcept.fake(...args)),
    performer: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirImmunizationPerformer.fake(...args)),
    protocol_applied: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirImmunizationProtocolApplied.fake(...args)),
  },
  FhirImagingStudy: {
    identifier: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirIdentifier.fake(...args)),
    basedOn: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirReference.fake(...args)),
    note: (...args: any[]) =>
      Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => FhirAnnotation.fake(...args)),
  },
};

export const fake = (
  model: typeof Model,
  passedOverrides: Record<string, any> = {},
): Record<string, any> => {
  const id = fakeUUID();
  const record = {};
  const modelOverridesFn = MODEL_SPECIFIC_OVERRIDES[model.name];
  const modelOverrides = modelOverridesFn ? modelOverridesFn(passedOverrides) : {};
  const overrides = { ...modelOverrides, ...passedOverrides };
  const overrideFields = Object.keys(overrides);

  function fakeField(name: string, attribute: any) {
    const { type, fieldName, defaultValue } = attribute;

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

    if (type instanceof DataTypes.ARRAY && (type as any).type) {
      return Array(chance.integer({ min: 0, max: 3 }))
        .fill(0)
        .map(() => fakeField(name, { ...attribute, type: (type as any).type }));
    }

    if (defaultValue) {
      if (defaultValue instanceof Sequelize.NOW || defaultValue instanceof Sequelize.UUIDV4) {
        return undefined;
      }
      return isFunction(defaultValue) ? defaultValue() : defaultValue;
    }

    if (type instanceof DataTypes.BLOB) {
      return Buffer.from('test');
    }

    if (FIELD_HANDLERS[type]) {
      return FIELD_HANDLERS[type](model, attribute, id);
    }

    if (type.type && FIELD_HANDLERS[type.type]) {
      return FIELD_HANDLERS[type.type](model, attribute, id);
    }

    if (type instanceof DataTypes.STRING && (type as any).options.length) {
      return FIELD_HANDLERS['VARCHAR(N)'](model, attribute, id, (type as any).options.length);
    }

    if (type instanceof DataTypes.JSONB && FHIR_MODELS_HANDLERS[model.name]?.[fieldName]) {
      return FHIR_MODELS_HANDLERS[model.name][fieldName](model, attribute, id);
    }

    if (type instanceof DataTypes.JSONB) {
      return { test: 'test' };
    }

    // if you hit this error, you probably need to add a new field handler or a model-specific override
    throw new Error(
      `Could not fake field ${model.name}.${name} of type ${type} / ${type.type} / ${inspect(
        type,
      )}`,
    );
  }

  for (const [name, attribute] of Object.entries(model.getAttributes())) {
    const fakeValue = fakeField(name, attribute);
    if (fakeValue !== undefined) record[name] = fakeValue;
  }

  return record;
};
