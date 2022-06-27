import { baseDataGenerator } from '../covid-swab-lab-test-list';

const SURVEY_ID = 'program-samoacovid19-samcovidsampcollectionv2';

const SURVEY_QUESTION_CODES = {
  phoneNumber: 'pde-samcovidsamp02',
  villageOnForm: 'pde-samcovidsamp03',
};

const reportColumnTemplate = [
  { title: 'Patient first name', accessor: data => data.firstName },
  { title: 'Patient last name', accessor: data => data.lastName },
  { title: 'DOB', accessor: data => data.dob },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Patient ID', accessor: data => data.patientId },
  { title: 'Village', accessor: data => data.village },
  { title: 'Nationality', accessor: data => data.additionalDataNationality },
  { title: 'Ethnicity', accessor: data => data.additionalDataEthnicity },
  { title: 'Phone Number', accessor: data => data.phoneNumber },
  { title: 'Village recorded on sample collection form', accessor: data => data.villageOnForm },
  { title: 'Lab request ID', accessor: data => data.labRequestId },
  { title: 'Lab request type', accessor: data => data.labRequestType },
  { title: 'Lab test type', accessor: data => data.labTestType },
  { title: 'Status', accessor: data => data.status },
  { title: 'Result', accessor: data => data.result },
  { title: 'Requested by', accessor: data => data.requestedBy },
  { title: 'Requested date', accessor: data => data.requestedDate },
  { title: 'Submitted date', accessor: data => data.submittedDate },
  { title: 'Priority', accessor: data => data.priority },
  { title: 'Testing laboratory', accessor: data => data.testingLaboratory },
  { title: 'Testing date', accessor: data => data.testingDate },
  { title: 'Time test completed', accessor: data => data.testingTime },
];

export const dataGenerator = async ({ models }, parameters = {}) =>
  baseDataGenerator({ models }, parameters, {
    surveyId: SURVEY_ID,
    surveyQuestionCodes: SURVEY_QUESTION_CODES,
    reportColumnTemplate,
  });

export const permission = 'LabTest';
