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
    bloodType: sample(['A', 'B', 'AB', 'O']) + sample(['+', '-']),
    dateOfBirth: new Date(random(0, Date.now())),
    villageId: null,
    additionalDetails: null,
    ethnicityId: null,
    title: null,
    countryId: null,
    divisionId: null,
    subdivisionId: null,
    email: null,
    medicalAreaId: null,
    nationalityId: null,
    nursingZoneId: null,
    occupationId: null,
    settlementId: null,
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
  return fakeStringFields(`${prefix}program_${id})_`, ['id', 'name', 'code']);
}

export function fakeAdministeredVaccine(prefix = 'test-') {
  const id = uuidv4();
  return {
    encounterId: null,
    scheduledVaccineId: null,
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
