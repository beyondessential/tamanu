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
  { title: 'Hamlet', accessor: data => data.village },
  { title: 'Nationality', accessor: data => data.additionalDataNationality ?? data.Nationality },
  { title: 'Ethnicity', accessor: data => data.additionalDataEthnicity ?? data.Ethnicity },
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
  { title: 'Submitted date', accessor: data => data.submittedDate },
  { title: 'Priority', accessor: data => data.priority },
  { title: 'Testing laboratory', accessor: data => data.testingLaboratory },
  { title: 'Testing date', accessor: data => data.testingDate },
  { title: 'Testing time', accessor: data => data.testingTime },
  { title: 'Contact number', accessor: data => data['Contact number'] },
  { title: 'Where was the test conducted', accessor: data => data['Where was the test conducted'] },
  { title: 'Purpose of sample collection', accessor: data => data['Purpose of sample collection'] },
  { title: 'Other purpose', accessor: data => data['Other purpose'] },
  {
    title: 'Passport number',
    accessor: data => data.additionalDataPassportNumber ?? data['Passport number'],
  },
  { title: 'Final destination', accessor: data => data['Final destination'] },
  { title: 'Transit country', accessor: data => data['Transit country'] },
  { title: 'Airline', accessor: data => data.Airline },
  { title: 'Testing cost', accessor: data => data['Testing cost'] },
];

export const dataGenerator = async ({ models }, parameters = {}) =>
  baseDataGenerator({ models }, parameters, {
    surveyId: SURVEY_ID,
    surveyQuestionCodes: SURVEY_QUESTION_CODES,
    reportColumnTemplate,
    dateFormat: 'yyyy/MM/dd',
  });
