import { v4 as uuidv4 } from 'uuid';

import {
  DataElementType,
  EncounterType,
  IAdministeredVaccine,
  IEncounter,
  IPatient,
  IProgramDataElement,
  IReferenceData,
  IScheduledVaccine,
  ISurvey,
  ISurveyResponse,
  ISurveyResponseAnswer,
  ISurveyScreenComponent,
  IUser,
} from '~/types';

export const fakePatient = (): IPatient => {
  const uuid = uuidv4();
  return {
    id: `patient-id-${uuid}`,
    displayId: `patient_displayId-${uuid}`,
    firstName: `patient_firstName-${uuid}`,
    middleName: `patient_middleName-${uuid}`,
    lastName: `patient_lastName-${uuid}`,
    culturalName: `patient_culturalName-${uuid}`,
    dateOfBirth: new Date(),
    bloodType: 'A+',
    sex: `female-${uuid}`,
    markedForSync: false,
  };
};

export const fakeEncounter = (): IEncounter => {
  return {
    id: `encounter-id-${uuidv4()}`,
    encounterType: EncounterType.Clinic,
    startDate: new Date(),
    reasonForEncounter: 'encounter-reason',
  };
};

export const fakeAdministeredVaccine = (): IAdministeredVaccine => {
  return {
    id: `administered-vaccine-id-${uuidv4()}`,
    status: 'done',
    date: new Date(),
  };
};

export const fakeProgramDataElement = (): IProgramDataElement => {
  return {
    id: `program-data-element-id-${uuidv4()}`,
    code: 'program-data-element-code',
    defaultText: 'program-data-element-defaultText',
    type: DataElementType.FreeText,
    defaultOptions: null,
    name: 'program-data-element-name',
  };
};

export const fakeSurvey = (): ISurvey => {
  return {
    id: `survey-id-${uuidv4()}`,
    name: 'survey-name',
  };
};

export const fakeSurveyScreenComponent = (): ISurveyScreenComponent => {
  return {
    id: `survey-screen-component-${uuidv4()}`,
    screenIndex: 1,
    componentIndex: 2,
    text: 'survey-screen-component-text',
    visibilityCriteria: 'survey-screen-component-visibilityCriteria',
    options: 'survey-screen-component-options',
    calculation: '',
  };
};

export const fakeSurveyResponse = (): ISurveyResponse => {
  return {
    id: `survey-response-id-${uuidv4()}`,
    startTime: new Date(),
    endTime: new Date(),
  };
};

export const fakeSurveyResponseAnswer = (): ISurveyResponseAnswer => {
  return {
    id: `survey-response-answer-id-${uuidv4()}`,
    body: 'survey-response-answer-body',
    name: 'survey-response-answer-name',
  };
};

export const fakeReferenceData = (): IReferenceData => {
  const uuid = uuidv4();
  return {
    id: `reference-data-id-${uuid}`,
    name: `reference-data-name-${uuid}`,
    code: `reference-data-code-${uuid}`,
    type: `reference-data-type-${uuid}`,
  };
};

export const fakeUser = (): IUser => {
  const uuid = uuidv4();
  return {
    id: `user-id-${uuid}`,
    email: `user-email-${uuid}@example.com`,
    displayName: `user-displayName-${uuid}`,
    role: 'practitioner',
    localPassword: null,
  };
};

export const fakeScheduledVaccine = (): IScheduledVaccine => {
  const uuid = uuidv4();
  return {
    id: `scheduled-vaccine-id-${uuid}`,
    index: 10,
    label: `scheduled-vaccine-label-${uuid}`,
    schedule: `scheduled-vaccine-schedule-${uuid}`,
    weeksFromBirthDue: 5,
    category: `scheduled-vaccine-category-${uuid}`,
    vaccine: null,
  };
};
