import { subDays } from 'date-fns';
import { format, toDateTimeString } from '../../../utils/dateTime';
import { baseDataGenerator } from '../covid-swab-lab-test-list';

const SURVEY_ID = 'program-fijicovidtourism-fijicovidtravform';

const SURVEY_QUESTION_CODES = {
  testFacility: 'pde-FijCOVRDT003',
  fijiAddress: 'pde-FijCOVRDT008a',
  subDivisionAddress: 'pde-FijCOVRDT008b',
  phone: 'pde-FijCOVRDT007',
  emailAddress: 'pde-FijCOVRDT008',
  symptomsStatus: 'pde-FijCOVRDT016',
  firstSymptomDate: 'pde-FijCOVRDT017',
  symptoms: 'pde-FijCOVRDT018',
  personConductingTest: 'pde-FijCOVRDT001',
  internationalTraveller: 'pde-FijCOVRDT002',
  hotelBorderWorker: 'pde-FijCOVRDT002a',
  travelDetails: 'pde-FijCOVRDT009',
  passport: 'pde-FijCOVRDT005',
  passportNationality: 'pde-PalauCOVSamp7',
  testPurpose: 'pde-FijCOVRDT004',
  arrivalDate: 'pde-FijCOVRDT010',
  originCountry: 'pde-FijCOVRDT012',
  arrivalFlight: 'pde-FijCOVRDT011',
  departureDate: 'pde-FijCOVRDT013',
  departureFlight: 'pde-FijCOVRDT014',
  departureDestination: 'pde-FijCOVRDT015',
  rapidTestsBrand: 'pde-FijCOVRDT003b',
  reasonForTest: 'pde-FijCOVRDT012a',
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
  // from lab request
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
  { title: 'Facility of user', accessor: data => data.facilityName },
  {
    title: 'Date of sample',
    accessor: data => format(data.sampleTime, 'yyyy/MM/dd'),
  },
  {
    title: 'Time of sample',
    accessor: data => format(data.sampleTime, 'hh:mm a'),
  },
  { title: 'Requested date', accessor: data => data.requestedDate },
  { title: 'Submitted date', accessor: data => data.submittedDate },
  { title: 'Priority', accessor: data => data.priority },
  { title: 'Testing laboratory', accessor: data => data.testingLaboratory },
  { title: 'Testing date', accessor: data => data.testingDate },
  // from survey
  {
    title:
      'Name of the facility where test is being conducted (hotel, resort or private testing facility)',
    accessor: data => data.testFacility,
  },
  { title: 'Address in Fiji', accessor: data => data.fijiAddress },
  { title: 'Sub-division of address', accessor: data => data.subDivisionAddress },
  { title: 'Phone contact', accessor: data => data.phone },
  { title: 'Email address (for results certificate)', accessor: data => data.emailAddress },
  { title: 'Symptoms status', accessor: data => data.symptomsStatus },
  { title: 'Date of first symptom', accessor: data => data.firstSymptomDate },
  { title: 'Symptoms', accessor: data => data.symptoms },
  { title: 'Name of person conducting the test', accessor: data => data.personConductingTest },
  {
    title: 'International traveller or non-international traveller',
    accessor: data => data.internationalTraveller,
  },
  { title: 'Hotel or international border worker', accessor: data => data.hotelBorderWorker },
  { title: 'Passport number', accessor: data => data.passport },
  { title: 'Nationality on passport', accessor: data => data.passportNationality },
  { title: 'Purpose of test for international traveller', accessor: data => data.testPurpose },
  { title: 'Date of arrival in Fiji', accessor: data => data.arrivalDate },
  { title: 'Country of travel origin', accessor: data => data.originCountry },
  { title: 'Arrival flight number or vessel name', accessor: data => data.arrivalFlight },
  { title: 'Departure date', accessor: data => data.departureDate },
  { title: 'Departure flight number or vessel name', accessor: data => data.departureFlight },
  { title: 'Destination', accessor: data => data.departureDestination },
  { title: 'Brand of Rapid Antigen Test', accessor: data => data.rapidTestsBrand },
  { title: 'Reason for test', accessor: data => data.reasonForTest },
];

export const dataGenerator = async ({ models }, parameters = {}) => {
  const newParameters = { ...parameters };
  if (!newParameters.fromDate) {
    newParameters.fromDate = toDateTimeString(subDays(new Date(), 30));
  }

  return baseDataGenerator({ models }, newParameters, {
    surveyId: SURVEY_ID,
    surveyQuestionCodes: SURVEY_QUESTION_CODES,
    reportColumnTemplate,
  });
};

export const permission = 'LabTest';
