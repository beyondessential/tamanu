import { startOfDay, subDays } from 'date-fns';
import { toDateTimeString, format } from '../../../utils/dateTime';
import { baseDataGenerator } from '../covid-swab-lab-test-list';

const SURVEY_ID = 'program-naurucovid19-naurucovidtestregistration';

const SURVEY_QUESTION_CODES = {
  'Patient contact number': 'pde-NauCOVTest002',
  'Test location': 'pde-NauCOVTest003',
  'Does patient have symptoms': 'pde-NauCOVTest005',
  'If Yes, date of first symptom onset': 'pde-NauCOVTest006',
  Symptoms: 'pde-NauCOVTest007',
  'Health Clinic': 'pde-NauCOVTest008',
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
  { title: 'Home sub-division', accessor: data => data.village },

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
    title: 'Lab test method',
    accessor: data => data.labTestMethod,
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
  {
    title: 'Laboratory officer',
    accessor: data => data.laboratoryOfficer,
  },
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

export const dataGenerator = async ({ models }, parameters = {}) => {
  const newParameters = { ...parameters };
  if (!newParameters.fromDate) {
    newParameters.fromDate = toDateTimeString(startOfDay(subDays(new Date(), 30)));
  }

  return baseDataGenerator({ models }, parameters, {
    surveyId: SURVEY_ID,
    surveyQuestionCodes: SURVEY_QUESTION_CODES,
    reportColumnTemplate,
    dateFilterBy: 'labRequest.sampleTime',
  });
};
