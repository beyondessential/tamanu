import { baseDataGenerator } from '../covid-swab-lab-test-list';

const SURVEY_ID = 'program-fijicovid19-fijicovidsampcollection';

const SURVEY_QUESTION_CODES = {
  publicHealthFacility: 'pde-FijCOVSamp4',
  subDivision: 'pde-FijCOVSamp7',
  ethnicity: 'pde-FijCOVSamp10',
  contactPhone: 'pde-FijCOVSamp11',
  residentialAddress: 'pde-FijCOVSamp12',
  purposeOfSample: 'pde-FijCOVSamp15',
  recentAdmission: 'pde-FijCOVSamp16',
  placeOfAdmission: 'pde-FijCOVSamp20',
  medicalProblems: 'pde-FijCOVSamp23',
  healthcareWorker: 'pde-FijCOVSamp26',
  occupation: 'pde-FijCOVSamp27',
  placeOfWork: 'pde-FijCOVSamp28',
  linkToCluster: 'pde-FijCOVSamp29',
  nameOfCluster: 'pde-FijCOVSamp30',
  pregnant: 'pde-FijCOVSamp32',
  experiencingSymptoms: 'pde-FijCOVSamp34',
  dateOfFirstSymptom: 'pde-FijCOVSamp35',
  symptoms: 'pde-FijCOVSamp36',
  vaccinated: 'pde-FijCOVSamp38',
  dateOf1stDose: 'pde-FijCOVSamp39',
  dateOf2ndDose: 'pde-FijCOVSamp40',
  privateHealthFacility: 'pde-FijCOVSamp54',
  highRisk: 'pde-FijCOVSamp59',
  primaryContactHighRisk: 'pde-FijCOVSamp60',
  highRiskDetails: 'pde-FijCOVSamp61',
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
  { title: 'Public health facility', accessor: data => data.publicHealthFacility },
  { title: 'Private health facility', accessor: data => data.privateHealthFacility },
  { title: 'Sub-division', accessor: data => data.subDivision },
  { title: 'Ethnicity', accessor: data => data.ethnicity },
  { title: 'Contact phone', accessor: data => data.contactPhone },
  { title: 'Residential address', accessor: data => data.residentialAddress },
  { title: 'Purpose of sample collection', accessor: data => data.purposeOfSample },
  { title: 'Recent admission', accessor: data => data.recentAdmission },
  { title: 'Place of admission', accessor: data => data.placeOfAdmission },
  { title: 'Medical problems', accessor: data => data.medicalProblems },
  { title: 'Healthcare worker', accessor: data => data.healthcareWorker },
  { title: 'Occupation', accessor: data => data.occupation },
  { title: 'Place of work', accessor: data => data.placeOfWork },
  { title: 'Link to cluster/case', accessor: data => data.linkToCluster },
  { title: 'Name of cluster', accessor: data => data.nameOfCluster },
  { title: 'Pregnant', accessor: data => data.pregnant },
  { title: 'Experiencing symptoms', accessor: data => data.experiencingSymptoms },
  { title: 'Date of first symptom', accessor: data => data.dateOfFirstSymptom },
  { title: 'Symptoms', accessor: data => data.symptoms },
  { title: 'Vaccinated', accessor: data => data.vaccinated },
  {
    title: 'Date of 1st dose',
    accessor: data => data.dateOf1stDose,
  },
  {
    title: 'Date of 2nd dose',
    accessor: data => data.dateOf2ndDose,
  },

  {
    title: 'Patient is at a higher risk of developing severe COVID-19',
    accessor: data => data.highRisk,
  },
  {
    title: 'Patient has a primary contact who is at a higher risk for developing severe COVID-19',
    accessor: data => data.primaryContactHighRisk,
  },
  { title: 'Details of high risk primary contact', accessor: data => data.highRiskDetails },
];

export const dataGenerator = async ({ models }, parameters = {}) =>
  baseDataGenerator({ models }, parameters, {
    surveyId: SURVEY_ID,
    surveyQuestionCodes: SURVEY_QUESTION_CODES,
    reportColumnTemplate,
  });
