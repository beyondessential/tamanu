import { baseDataGenerator } from '../covid-swab-lab-test-list';

const SURVEY_ID = 'program-palaucovid19-palaucovidtestregistrationform';

const SURVEY_QUESTION_CODES = {
  Consent: 'pde-PalauCOVSamp2',
  'First name of guardian': 'pde-PalauCOVSamp3',
  'Last name of guardian': 'pde-PalauCOVSamp4',
  'Contact number': 'pde-PalauCOVSamp6',
  Citizenship: 'pde-PalauCOVSamp7',
  Ethnicity: 'pde-PalauCOVSamp43',
  Race: 'pde-PalauCOVSamp44',
  'State for the last 14 days': 'pde-PalauCOVSamp8',
  'Test conducted at BNH': 'pde-PalauCOVSamp10',
  'If test not conducted at BNH, which facility?': 'pde-PalauCOVSamp11',
  'Purpose of sample collection': 'pde-PalauCOVSamp12',
  'Other purpose': 'pde-PalauCOVSamp13',
  'Printed result': 'pde-PalauCOVSamp14',
  'Individual paid': 'pde-PalauCOVSamp15',
  'Passport number': 'pde-PalauCOVSamp16',
  'Final destination': 'pde-PalauCOVSamp17',
  'Transit country': 'pde-PalauCOVSamp18',
  Airline: 'pde-PalauCOVSamp19',
  'Medical problems': 'pde-PalauCOVSamp21',
  'Other medical problems': 'pde-PalauCOVSamp22',
  Pregnant: 'pde-PalauCOVSamp23',
  'Link to cluster/case': 'pde-PalauCOVSamp24',
  'Name cluster/case': 'pde-PalauCOVSamp25',
  Occupation: 'pde-PalauCOVSamp27',
  'MHHS department': 'pde-PalauCOVSamp28',
  'MHHS facility': 'pde-PalauCOVSamp29',
  'Other employer': 'pde-PalauCOVSamp30',
  School: 'pde-PalauCOVSamp31',
  'Experiencing symptoms': 'pde-PalauCOVSamp34',
  'Date of first symptom': 'pde-PalauCOVSamp35',
  Symptoms: 'pde-PalauCOVSamp36',
  'Other symptoms': 'pde-PalauCOVSamp37',
  Vaccinated: 'pde-PalauCOVSamp38',
  '1st dose': 'pde-PalauCOVSamp39',
  '2nd dose': 'pde-PalauCOVSamp40',
  'Booster dose': 'pde-PalauCOVSamp41',
  'Date of last dose': 'pde-PalauCOVSamp42',
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
