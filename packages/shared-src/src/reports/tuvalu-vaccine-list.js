import moment from 'moment';
import { Op } from 'sequelize';
import { groupBy } from 'lodash';
import { generateReportFromQueryData, getAnswers, transformAnswers } from './utilities';
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

const SURVEY_ID = 'program-fijicovid19-fijicovidsampcollection';
// const SURVEY_ID = 'program-kiribaticovid19-kiribaticovidtestregistration';

const addabc = async (models, vaccineData) => {
  const allPatientIds = vaccineData.map(({ id }) => id);
  console.log(allPatientIds);
  const where = {
    '$surveyResponse->encounter.patient_id$': allPatientIds,
    '$surveyResponse.survey_id$': SURVEY_ID,
  };
  // console.log(where);
  const rawAnswers = await getAnswers(models, where);
  // console.log(rawAnswers);
  const surveyComponents = await models.SurveyScreenComponent.getComponentsForSurvey(SURVEY_ID);
  // console.log(surveyComponents);
  const transformedAnswers = await transformAnswers(models, rawAnswers, surveyComponents);
  // console.log(transformedAnswers);
  const answersByPatient = groupBy(transformedAnswers, 'patientId');
  console.log(answersByPatient);

  return vaccineData.map(data => ({
    ...data,
    ...answersByPatient[data.id].reduce(
      ([acc, { body, dataElementId }]) => ({ ...acc, [dataElementId]: body }),
      {},
    ),
  }));
};

export async function dataGenerator({ models }, parameters) {
  const queryResults = await queryCovidVaccineListData(models, parameters);
  const reportData = await addabc(models, queryResults);
  return generateReportFromQueryData(reportData, reportColumnTemplate);
}

export const permission = 'PatientVaccine';
