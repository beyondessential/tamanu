import { baseDataGenerator } from '../covid-swab-lab-test-list';

const SURVEY_ID = 'program-palaucovid19-palaucovidtestregistrationform';

const SURVEY_QUESTION_CODES = {
  'Contact number': 'pde-PalauCOVSamp6',
  Nationality: 'pde-PalauCOVSamp7',
  Ethnicity: 'pde-PalauCOVSamp43',
  'Where was the test conducted': 'pde-PalauCOVSamp46',
  'Purpose of sample collection': 'pde-PalauCOVSamp12',
  'Other purpose': 'pde-PalauCOVSamp13',
  'Passport number': 'pde-PalauCOVSamp16',
  'Final destination': 'pde-PalauCOVSamp17',
  'Transit country': 'pde-PalauCOVSamp18',
  Airline: 'pde-PalauCOVSamp19',
  'Testing cost': 'pde-PalauCOVSamp19a',
};

const reportColumnTemplate = [
  {
    title: 'Patient first name',
    accessor: data => data.firstName,
  },
  {
    title: 'Patient last name',
    accessor: data => data.lastName,
  },
  {
    title: 'DOB',
    accessor: data => data.dob,
  },
  { title: 'Sex', accessor: data => data.sex },
  { title: 'Patient ID', accessor: data => data.patientId },
  { title: 'Hamlet', accessor: data => data.homeSubDivision },
  { title: 'Nationality', accessor: data => data.Nationality }, // TODO
  { title: 'Ethnicity', accessor: data => data.Ethnicity }, // TODO
  { title: 'Lab request ID', accessor: data => data.labRequestId },
  {
    title: 'Lab request type',
    accessor: data => data.labRequestType,
  },
  {
    title: 'Lab test type',
    accessor: data => data.labTestType,
  },
  {
    title: 'Status',
    accessor: data => data.status,
  },
  { title: 'Result', accessor: data => data.result },
  { title: 'Requested by', accessor: data => data.requestedBy },
  { title: 'Requested date', accessor: data => data.requestedDate },
  { title: 'Priority', accessor: data => data.priority },
  { title: 'Testing laboratory', accessor: data => data.testingLaboratory },
  { title: 'Testing date', accessor: data => data.testingDate },
  { title: 'Testing time', accessor: data => data.testingTime },
  ...Object.entries(SURVEY_QUESTION_CODES).map(([title, questionCode]) => ({
    title,
    accessor: data => data[title],
  })),
];

export const dataGenerator = async ({ models }, parameters = {}) => {
  return baseDataGenerator({ models }, parameters, {
    surveyId: SURVEY_ID,
    surveyQuestionCodes: SURVEY_QUESTION_CODES,
    reportColumnTemplate,
    dateFormat: 'MM/DD/YYYY',
  });
};

export const permission = 'LabTest';
