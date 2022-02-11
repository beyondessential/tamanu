import { baseDataGenerator } from '../covid-swab-lab-test-list';

const SURVEY_ID = 'program-kiribaticovid19-kiribaticovidtestregistration';

const SURVEY_QUESTION_CODES = {
  'Patient contact number': 'KirCOVTest003',
  'Patient head of household': 'KirCOVTest004',
  Residence: 'KirCOVTest011',
  'Does patient have symptoms': 'KirCOVTest006',
  'If Yes, date of first symptom onset': 'KirCOVTest007',
  Symptoms: 'KirCOVTest008',
  'Is a COVID-19 test being done?': 'KirCOVTest010',
  'Temporary testing site location': 'KirCOVTest002',
};

const reportColumnTemplate = [
  { title: 'Patient first name', accessor: data => data.firstName },
  { title: 'Patient last name', accessor: data => data.lastName },
  { title: 'DOB', accessor: data => data.dob },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Patient ID', accessor: data => data.patientId },
  { title: 'Village', accessor: data => data.village },
  { title: 'Lab request ID', accessor: data => data.labRequestId },
  { title: 'Lab request type', accessor: data => data.labRequestType },
  { title: 'Lab test type', accessor: data => data.labTestType },
  { title: 'Status', accessor: data => data.status },
  { title: 'Result', accessor: data => data.result },
  { title: 'Requested by', accessor: data => data.requestedBy },
  { title: 'Requested date', accessor: data => data.requestedDate },
  { title: 'Priority', accessor: data => data.priority },
  { title: 'Testing laboratory', accessor: data => data.testingLaboratory },
  { title: 'Testing date', accessor: data => data.testingDate },
  ...Object.entries(SURVEY_QUESTION_CODES).map(([name, code]) => ({
    title: name,
    accessor: data => data[name],
  })),
];

export const dataGenerator = async ({ models }, parameters = {}) => {
  return baseDataGenerator({ models }, parameters, {
    surveyId: SURVEY_ID,
    surveyQuestionCodes: SURVEY_QUESTION_CODES,
    reportColumnTemplate,
  });
};

export const permission = 'LabTest';
