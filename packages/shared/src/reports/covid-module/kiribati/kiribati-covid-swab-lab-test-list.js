import { baseDataGenerator } from '../covid-swab-lab-test-list';
import { format } from '../../../utils/dateTime';

const SURVEY_ID = 'program-kiribaticovid19-kiribaticovidtestregistration';

const SURVEY_QUESTION_CODES = {
  'Patient contact number': 'pde-KirCOVTest003',
  'Patient head of household': 'pde-KirCOVTest004',
  'Island of Residence': 'pde-KirCOVTest011',
  'Village of Residence': 'pde-KirCOVTest012',
  'Does patient have symptoms': 'pde-KirCOVTest006',
  'If Yes, date of first symptom onset': 'pde-KirCOVTest007',
  Symptoms: 'pde-KirCOVTest008',
  'Is a COVID-19 test being done?': 'pde-KirCOVTest010',
  'Health Clinic': 'pde-KirCOVTest002',
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
  { title: 'Lab test method', accessor: data => data.labTestMethod },
  { title: 'Status', accessor: data => data.status },
  { title: 'Result', accessor: data => data.result },
  { title: 'Requested by', accessor: data => data.requestedBy },
  { title: 'Requested date', accessor: data => data.requestedDate },
  { title: 'Submitted date', accessor: data => data.submittedDate },
  { title: 'Priority', accessor: data => data.priority },
  { title: 'Testing laboratory', accessor: data => data.testingLaboratory },
  { title: 'Testing date', accessor: data => data.testingDate },
  {
    title: 'Sample collection date',
    accessor: data => format(data.sampleTime, 'yyyy/MM/dd'),
  },
  {
    title: 'Sample collection time',
    accessor: data => format(data.sampleTime, 'hh:mm a'),
  },
  ...Object.keys(SURVEY_QUESTION_CODES).map(name => ({
    title: name,
    accessor: data => data[name],
  })),
];

export const dataGenerator = async ({ models }, parameters = {}) =>
  baseDataGenerator({ models }, parameters, {
    surveyId: SURVEY_ID,
    surveyQuestionCodes: SURVEY_QUESTION_CODES,
    reportColumnTemplate,
  });

export const permission = 'LabTest';
