import { groupBy } from 'lodash';
import {
  generateReportFromQueryData,
  getAnswers,
  transformAnswers,
  takeMostRecentAnswers,
} from './utilities';
import {
  queryCovidVaccineListData,
  reportColumnTemplate as baseReportColumnTemplate,
} from './vaccine-list';

const SURVEY_QUESTION_CODES = {
  'Parent/guardian name': 'pde-TuvCOVCon013',
  Relationship: 'pde-TuvCOVCon014',
  Address: 'pde-TuvCOVCon015',
  'Home island': 'pde-TuvCOVCon016',
  'Contact number': 'pde-TuvCOVCon017',
  Occupation: 'pde-TuvCOVCon018',
  'If student, please select school': 'pde-TuvCOVCon019',
  'Email ID:': 'pde-TuvCOVCon020',
  'Any existing medical condition': 'pde-TuvCOVCon021',
  'If yes, please list medical condition/s': 'pde-TuvCOVCon022',
  'Any reactions after vaccination in the past': 'pde-TuvCOVCon023',
  'Emergency number contact:': 'pde-TuvCOVCon024',
  'Relationship:': 'pde-TuvCOVCon025',
  'I have read and understood the above-mentioned details. As a parent/guardian, I am hereby giving my full consent to vaccinate against COVID-19 at my own will. (Please select)':
    'pde-TuvCOVCon026',
  'Date consent given': 'pde-TuvCOVCon027',
};

const reportColumnTemplate = [
  ...baseReportColumnTemplate,
  ...Object.entries(SURVEY_QUESTION_CODES).map(([name, questionId]) => ({
    title: name,
    accessor: data => data[questionId],
  })),
];

const SURVEY_ID = 'program-tuvalucovid19-tuvalucovidconsent';

const getAnswersKeyedByDataElementId = (answers = []) =>
  answers.reduce(
    (keyedAnswers, { dataElementId, body }) => ({
      ...keyedAnswers,
      [dataElementId]: body,
    }),
    {},
  );

const getConsentSurveyDataByPatient = async (models, patientIds) => {
  const where = {
    '$surveyResponse->encounter.patient_id$': patientIds,
    '$surveyResponse.survey_id$': SURVEY_ID,
  };
  const rawAnswers = await getAnswers(models, where);
  const surveyComponents = await models.SurveyScreenComponent.getComponentsForSurvey(SURVEY_ID);
  const transformedAnswers = await transformAnswers(models, rawAnswers, surveyComponents);
  // Technically this filtering is not needed since answers are already sorted by date,
  // but I think this is safer and easier to read.
  const filteredAnswers = takeMostRecentAnswers(transformedAnswers);
  return groupBy(filteredAnswers, 'patientId');
};

const addSurveyDataToVaccinations = async (models, vaccineData) => {
  const allPatientIds = vaccineData.map(({ patientId }) => patientId);
  const answersByPatient = await getConsentSurveyDataByPatient(models, allPatientIds);

  const mergeDataWithAnswers = data => ({
    ...data,
    ...getAnswersKeyedByDataElementId(answersByPatient[data.patientId]),
  });

  return vaccineData.map(mergeDataWithAnswers);
};

export async function dataGenerator({ models }, parameters) {
  const vaccinationData = await queryCovidVaccineListData(models, parameters);
  const reportData = await addSurveyDataToVaccinations(models, vaccinationData);
  return generateReportFromQueryData(reportData, reportColumnTemplate);
}

export const permission = 'PatientVaccine';
