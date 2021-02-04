import { IPatient, IAdministeredVaccine, IProgramDataElement, ISurvey, ISurveyResponse, ISurveyResponseAnswer, DataElementType } from '~/types';

export const fakePatient = (): IPatient => {
  return {
    id: 'patient_id',
    displayId: 'patient_displayId',
    firstName: 'patient_firstName',
    middleName: 'patient_middleName',
    lastName: 'patient_lastName',
    culturalName: 'patient_culturalName',
    dateOfBirth: new Date(),
    bloodType: 'A+',
    sex: 'female',
  };
};

export const fakeAdministeredVaccine = (): IAdministeredVaccine => {
  return {
    id: 'administered-vaccine-id',
    status: 'done',
    date: new Date(),
  };
};

export const fakeProgramDataElement = (): IProgramDataElement => {
  return {
    id: 'program-data-element-id',
    code: 'program-data-element-code',
    defaultText: 'program-data-element-defaultText',
    type: DataElementType.FreeText,
  };
};

export const fakeSurvey = (): ISurvey => {
  return {
    id: 'survey-id',
    name: 'survey-name',
  };
};

export const fakeSurveyResponse = (): ISurveyResponse => {
  return {
    id: 'survey-response-id',
    startTime: new Date(),
    endTime: new Date(),
  };
};

export const fakeSurveyResponseAnswer = (): ISurveyResponseAnswer => {
  return {
    id: 'survey-response-answer-id',
    body: 'survey-response-answer-body',
    name: 'survey-response-answer-name',
  };
};
