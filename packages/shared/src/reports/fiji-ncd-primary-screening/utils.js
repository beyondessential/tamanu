import { endOfDay, parseISO, startOfDay } from 'date-fns';
import { groupBy, keyBy } from 'lodash';
import { Op } from 'sequelize';
import { format, differenceInMilliseconds, toDateTimeString } from '../../utils/dateTime';
import { transformAnswers } from '../utilities';

import {
  CVD_SURVEY_IDS,
  BREAST_CANCER_SURVEY_IDS,
  CERVICAL_CANCER_SURVEY_IDS,
  CVD_SURVEY_GROUP_KEY,
  BREAST_CANCER_SURVEY_GROUP_KEY,
  CERVICAL_CANCER_SURVEY_GROUP_KEY,
  CVD_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS,
  BREAST_CANCER_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS,
  CERVICAL_CANCER_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS,
  CVD_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS,
  BREAST_CANCER_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS,
  CERVICAL_CANCER_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS,
  ALL_SURVEY_IDS,
  BREAST_CANCER_FORM_SURVEY_ID,
  getSurveyResultDataElement,
} from './constants';

export const parametersToAnswerSqlWhere = parameters => {
  const where = {
    '$surveyResponse.survey_id$': {
      [Op.in]: ALL_SURVEY_IDS,
    },
  };

  if (!parameters || !Object.keys(parameters).length) {
    return where;
  }

  if (parameters.fromDate || parameters.toDate) {
    where['$surveyResponse.end_time$'] = {};
  }
  if (parameters.fromDate) {
    where['$surveyResponse.end_time$'][Op.gte] = toDateTimeString(
      startOfDay(parseISO(parameters.fromDate)),
    );
  }
  if (parameters.toDate) {
    where['$surveyResponse.end_time$'][Op.lte] = toDateTimeString(
      endOfDay(parseISO(parameters.toDate)),
    );
  }
  if (parameters.surveyId) {
    delete where['$surveyResponse.survey_id$'][Op.in];
    const surveyGroupKey = getSurveyGroupKey(parameters.surveyId);
    where['$surveyResponse.survey_id$'][Op.in] = getSurveyIdsByGroupKey(surveyGroupKey);
  }

  return where;
};

const getPatients = async (models, patientIds) =>
  models.Patient.findAll({
    include: [
      {
        model: models.PatientAdditionalData,
        as: 'additionalData',
        include: ['ethnicity', 'medicalArea', 'nursingZone'],
      },
      'village',
    ],
    where: {
      id: {
        [Op.in]: patientIds,
      },
    },
    order: [['firstName', 'ASC']],
  });

export const getPerPatientPerSurveyPerDatePerElementKey = (
  patientId,
  surveyGroupKey,
  responseDate,
  dataElementId,
) => `${patientId}|${surveyGroupKey}|${responseDate}|${dataElementId}`;

export const getCachedAnswer = (
  answersByPatientSurveyDataElement,
  patientId,
  surveyGroupKey,
  responseDate,
  dataElementId,
) =>
  answersByPatientSurveyDataElement[
    getPerPatientPerSurveyPerDatePerElementKey(
      patientId,
      surveyGroupKey,
      responseDate,
      dataElementId,
    )
  ]?.body;

export const getSurveyGroupKey = surveyId => {
  if (CVD_SURVEY_IDS.includes(surveyId)) {
    return CVD_SURVEY_GROUP_KEY;
  }
  if (BREAST_CANCER_SURVEY_IDS.includes(surveyId)) {
    return BREAST_CANCER_SURVEY_GROUP_KEY;
  }
  if (CERVICAL_CANCER_SURVEY_IDS.includes(surveyId)) {
    return CERVICAL_CANCER_SURVEY_GROUP_KEY;
  }
  // should never happen
  throw new Error(`Unknown survey id: ${surveyId}`);
};

export const getSurveyIdsByGroupKey = surveyGroupKey => {
  switch (surveyGroupKey) {
    case BREAST_CANCER_SURVEY_GROUP_KEY:
      return BREAST_CANCER_SURVEY_IDS;
    case CVD_SURVEY_GROUP_KEY:
      return CVD_SURVEY_IDS;
    case CERVICAL_CANCER_SURVEY_GROUP_KEY:
    default:
      return CERVICAL_CANCER_SURVEY_IDS;
  }
};

export const getFormDataElements = surveyGroupKey => {
  switch (surveyGroupKey) {
    case CVD_SURVEY_GROUP_KEY:
      return CVD_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS;
    case BREAST_CANCER_SURVEY_GROUP_KEY:
      return BREAST_CANCER_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS;
    case CERVICAL_CANCER_SURVEY_GROUP_KEY:
    default:
      return CERVICAL_CANCER_PRIMARY_SCREENING_FORM_DATA_ELEMENT_IDS;
  }
};

export const getReferralDataElements = surveyGroupKey => {
  switch (surveyGroupKey) {
    case CVD_SURVEY_GROUP_KEY:
      return CVD_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS;
    case BREAST_CANCER_SURVEY_GROUP_KEY:
      return BREAST_CANCER_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS;
    case CERVICAL_CANCER_SURVEY_GROUP_KEY:
    default:
      return CERVICAL_CANCER_PRIMARY_SCREENING_REFERRAL_DATA_ELEMENT_IDS;
  }
};

/**
 * Have to query patients separately instead of joining with encounters because
 * there's a weird bug in sequelize that if you have too many nested levels of include,
 * it will truncate the property names in the records.
 * https://github.com/sequelize/sequelize/issues/4158
 */
export const getPatientById = async (models, rawAnswers) => {
  const patientIds = rawAnswers.map(a => a.surveyResponse?.encounter?.patientId);
  const patients = await getPatients(models, patientIds);
  return keyBy(patients, 'id');
};

export const removeDuplicatedReferralsPerDate = referrals => {
  const referralByPatientAndDate = groupBy(referrals, r => {
    const referralDate = format(r.surveyResponse.endTime, 'dd-MM-yyyy');
    return `${r.initiatingEncounter.patientId}|${r.surveyResponse.surveyId}|${referralDate}`;
  });

  const results = [];
  for (const groupedAnswers of Object.values(referralByPatientAndDate)) {
    const sortedLatestToOldestReferrals = groupedAnswers.sort((r1, r2) =>
      differenceInMilliseconds(r2.initiatingEncounter.startDate, r1.initiatingEncounter.startDate),
    );
    results.push(sortedLatestToOldestReferrals[0]);
  }

  return results;
};

export const removeDuplicatedAnswersPerDate = answers => {
  const answersPerElement = groupBy(answers, a => {
    const responseDate = format(a.responseEndTime, 'dd-MM-yyyy');
    return `${a.patientId}|${a.surveyId}|${responseDate}|${a.dataElementId}`;
  });

  const results = [];
  for (const groupedAnswers of Object.values(answersPerElement)) {
    const sortedLatestToOldestAnswers = groupedAnswers.sort((a1, a2) =>
      differenceInMilliseconds(a2.responseEndTime, a1.responseEndTime),
    );
    results.push(sortedLatestToOldestAnswers[0]);
  }

  return results;
};

export const transformAndRemoveDuplicatedAnswersPerDate = async (models, rawAnswers, surveyIds) => {
  const components = await models.SurveyScreenComponent.getComponentsForSurveys(surveyIds, {
    includeAllVitals: true,
  });
  const answersIncludingResults = [...rawAnswers, ...getSurveyResultsFromAnswers(rawAnswers)];
  const transformedAnswers = await transformAnswers(models, answersIncludingResults, components);
  return removeDuplicatedAnswersPerDate(transformedAnswers);
};

const getSurveyResultBody = surveyResponse => {
  // There is also a `result` in surveyResponse, but since
  // it is not used for fiji-ncd and this is a local util,
  // we just use resultText.
  const { surveyId, resultText } = surveyResponse;
  if (surveyId === BREAST_CANCER_FORM_SURVEY_ID) {
    return resultText || 'Not high risk';
  }
  return resultText;
};

const getSurveyResultsFromAnswers = answers => {
  const surveyResponses = answers.map(a => a.surveyResponse);

  const seenSurveyResponseIds = new Set();
  const uniqueSurveyResponses = surveyResponses.filter(({ id }) => {
    if (seenSurveyResponseIds.has(id)) {
      return false;
    }
    seenSurveyResponseIds.add(id);
    return true;
  });

  const surveyResults = uniqueSurveyResponses.map(sr => ({
    dataElementId: getSurveyResultDataElement(sr.surveyId),
    surveyResponse: sr,
    body: getSurveyResultBody(sr),
  }));

  return surveyResults;
};
