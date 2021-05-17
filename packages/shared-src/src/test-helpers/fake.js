import { Sequelize } from 'sequelize';
import { random, sample } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import {
  DIAGNOSIS_CERTAINTY_VALUES,
  ENCOUNTER_TYPE_VALUES,
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  REFERENCE_TYPE_VALUES,
} from 'shared/constants';

export function fakeStringFields(prefix, fields) {
  return fields.reduce(
    (obj, field) => ({
      ...obj,
      [field]: prefix + field,
    }),
    {},
  );
}

export function fakePatient(prefix = 'test-') {
  const id = uuidv4();
  return {
    ...fakeStringFields(`${prefix}patient_${id}_`, [
      'id',
      'firstName',
      'middleName',
      'lastName',
      'culturalName',
      'displayId',
    ]),
    sex: sample(['male', 'female', 'other']),
    dateOfBirth: new Date(random(0, Date.now())),
    email: null,
    villageId: null,
  };
}

export function fakeScheduledVaccine(prefix = 'test-') {
  const id = uuidv4();
  return {
    weeksFromBirthDue: random(0, 1000),
    index: random(0, 50),
    vaccineId: null,
    ...fakeStringFields(`${prefix}scheduledVaccine_${id}_`, [
      'id',
      'category',
      'label',
      'schedule',
    ]),
  };
}

export function fakeSurvey(prefix = 'test-') {
  const id = uuidv4();
  return {
    programId: null,
    surveyType: 'programs',
    ...fakeStringFields(`${prefix}survey_${id}_`, ['id', 'code', 'name']),
  };
}

export function fakeSurveyScreenComponent(prefix = 'test-') {
  const id = uuidv4();
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
  const id = uuidv4();
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
  const id = uuidv4();
  return {
    type: sample(REFERENCE_TYPE_VALUES),
    ...fakeStringFields(`${prefix}referenceData_${id}_`, ['id', 'name', 'code']),
  };
}

export function fakeUser(prefix = 'test-') {
  const id = uuidv4();
  return fakeStringFields(`${prefix}user_${id}_`, ['id', 'email', 'displayName', 'role']);
}

export function fakeProgram(prefix = 'test-') {
  const id = uuidv4();
  return fakeStringFields(`${prefix}program_${id}_`, ['id', 'name', 'code']);
}

export function fakeAdministeredVaccine(prefix = 'test-', scheduledVaccineId) {
  const id = uuidv4();
  return {
    encounterId: null,
    scheduledVaccineId: scheduledVaccineId,
    date: new Date(random(0, Date.now())),
    ...fakeStringFields(`${prefix}administeredVaccine_${id}_`, [
      'id',
      'batch',
      'status',
      'reason',
      'location',
    ]),
  };
}

export function fakeEncounter(prefix = 'test-') {
  const id = uuidv4();
  return {
    deviceId: null,
    surveyResponses: [],
    administeredVaccines: [],
    encounterType: sample(ENCOUNTER_TYPE_VALUES),
    startDate: new Date(random(0, Date.now())),
    endDate: new Date(random(0, Date.now())),
    ...fakeStringFields(`${prefix}encounter_${id}_`, ['id', 'reasonForEncounter']),
  };
}

export function fakeSurveyResponse(prefix = 'test-') {
  const id = uuidv4();
  return {
    answers: [],
    encounterId: null,
    surveyId: null,
    startTime: new Date(random(0, Date.now())),
    endTime: new Date(random(0, Date.now())),
    result: Math.random() * 100,
    ...fakeStringFields(`${prefix}surveyResponse_${id}_`, ['id']),
  };
}

export function fakeSurveyResponseAnswer(prefix = 'test-') {
  const id = uuidv4();
  return {
    dataElementId: null,
    responseId: null,
    ...fakeStringFields(`${prefix}surveyResponseAnswer_${id}_`, ['id', 'name', 'body']),
  };
}

export function fakeEncounterDiagnosis(prefix = 'test-') {
  const id = uuidv4();
  return {
    certainty: sample(DIAGNOSIS_CERTAINTY_VALUES),
    date: new Date(random(0, Date.now())),
    isPrimary: sample([true, false]),
    encounterId: null,
    diagnosisId: null,
    ...fakeStringFields(`${prefix}encounterDiagnosis_${id}_`, ['id']),
  };
}

export function fakeEncounterMedication(prefix = 'test-') {
  const id = uuidv4();
  return {
    date: new Date(random(0, Date.now())),
    endDate: new Date(random(0, Date.now())),
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

const fakeDate = () => new Date(random(0, Date.now()));
const fakeString = (model, { fieldName }, id) => `${model.name}.${fieldName}.${id}`;
const fakeInt = () => random(0, 10);
const fakeFloat = () => Math.random() * 1000;
const fakeBool = () => sample([true, false]);
const FIELD_HANDLERS = {
  'TIMESTAMP WITH TIME ZONE': fakeDate,
  DATETIME: fakeDate,
  'VARCHAR(255)': fakeString,
  'VARCHAR(31)': (...args) => fakeString(...args).slice(0, 31),
  TEXT: fakeString,
  INTEGER: fakeInt,
  FLOAT: fakeFloat,
  'TINYINT(1)': fakeBool,
  BOOLEAN: fakeBool,
  ENUM: (model, { type }) => sample(type.values),
};

const IGNORED_FIELDS = [
  'createdAt',
  'updatedAt',
  'deletedAt',
  'pushedAt',
  'pulledAt',
  'markedForPush',
  'markedForSync',
];

export const fake = model => {
  const id = uuidv4();
  const record = {};
  for (const [name, attribute] of Object.entries(model.tableAttributes)) {
    const type = attribute.type;
    if (attribute.references) {
      // null out id fields
      record[name] = null;
    } else if (IGNORED_FIELDS.includes(attribute.fieldName)) {
      // ignore metadata fields
    } else if (FIELD_HANDLERS[type]) {
      record[name] = FIELD_HANDLERS[type](model, attribute, id);
    } else {
      // if you hit this error, you probably need to add a new field handler
      throw new Error(`Could not fake field ${model.name}.${name} of type ${type}`);
    }
  }
  return record;
};
