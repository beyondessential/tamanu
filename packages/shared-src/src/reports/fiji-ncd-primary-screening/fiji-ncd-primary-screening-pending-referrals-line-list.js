import { keyBy } from 'lodash';
import { Op } from 'sequelize';
import { endOfDay, isAfter, parseISO, startOfDay } from 'date-fns';
import { REFERRAL_STATUSES } from '../../constants';
import { generateReportFromQueryData, getAnswers } from '../utilities';
import {
  transformAndRemoveDuplicatedAnswersPerDate,
  getPatientById,
  removeDuplicatedReferralsPerDate,
  getSurveyGroupKey,
  getFormDataElements,
  getReferralDataElements,
  getPerPatientPerSurveyPerDatePerElementKey,
  getCachedAnswer,
  parametersToAnswerSqlWhere,
} from './utils';
import { ageInYears, format, toDateTimeString } from '../../utils/dateTime';

import {
  REFERRAL_SURVEY_IDS,
  PRIMARY_SCREENING_PENDING_REFERRALS_REPORT_COLUMN_TEMPLATE,
  REFERRAL_NAME_BY_SURVEY_GROUP_KEY,
  ALL_SURVEY_IDS,
} from './constants';

const parametersToReferralSqlWhere = parameters => {
  const where = {
    '$surveyResponse.survey_id$': {
      [Op.in]: REFERRAL_SURVEY_IDS,
    },
    status: [REFERRAL_STATUSES.PENDING], // PENDING referrals
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
    where['$surveyResponse.survey_id$'][Op.eq] = parameters.surveyId;
  }

  return where;
};

const getPendingReferrals = async (models, surveyIds, parameters) =>
  models.Referral.findAll({
    where: parametersToReferralSqlWhere(parameters),
    include: [
      {
        model: models.Encounter,
        as: 'initiatingEncounter',
      },
      {
        model: models.SurveyResponse,
        as: 'surveyResponse',
        where: {
          surveyId: { [Op.in]: surveyIds },
        },
      },
    ],
    order: [[{ model: models.SurveyResponse, as: 'surveyResponse' }, 'end_time', 'ASC']],
  });

const sortReferrals = (r1, r2) => {
  const patientId1 = r1.initiatingEncounter?.patientId;
  const patientId2 = r2.initiatingEncounter?.patientId;
  const surveyGroupKey1 = getSurveyGroupKey(r1.surveyResponse?.surveyId);
  const surveyGroupKey2 = getSurveyGroupKey(r2.surveyResponse?.surveyId);
  const responseTime1 = r1.surveyResponse?.endTime;
  const responseTime2 = r2.surveyResponse?.endTime;

  return (
    patientId1.localeCompare(patientId2) ||
    surveyGroupKey1.localeCompare(surveyGroupKey2) ||
    isAfter(responseTime1, responseTime2)
  );
};

export const dataGenerator = async ({ models }, parameters = {}) => {
  const referrals = await getPendingReferrals(models, REFERRAL_SURVEY_IDS, parameters);
  const filteredReferrals = await removeDuplicatedReferralsPerDate(referrals);
  const sortedReferrals = filteredReferrals.sort(sortReferrals);

  const answerWhereClause = parametersToAnswerSqlWhere(parameters);
  const rawAnswers = await getAnswers(models, answerWhereClause);
  const filteredAnswers = await transformAndRemoveDuplicatedAnswersPerDate(
    models,
    rawAnswers,
    ALL_SURVEY_IDS,
  );
  const patientById = await getPatientById(models, rawAnswers);
  const answersByPatientSurveyDataElement = keyBy(filteredAnswers, a => {
    const responseDate = format(a.responseEndTime, 'dd-MM-yyyy');
    const surveyGroupKey = getSurveyGroupKey(a.surveyId);
    return getPerPatientPerSurveyPerDatePerElementKey(
      a.patientId,
      surveyGroupKey,
      responseDate,
      a.dataElementId,
    );
  });
  const reportData = [];

  // Report should create a new line for each patient with the below referrals in a status of pending:
  // CVD Primary Screening Referral
  // Breast Cancer Primary Screening Referral
  // Cervical Cancer Primary Screening Referral
  // If there are multiple referral submission on the same date (with same referral survey), it should take the
  // latest answer for each data element regardless of which referral submission
  // For each referral, pull most recent corresponding screening details (on the same date date)
  for (const referral of sortedReferrals) {
    const referralSurveyResponse = referral.surveyResponse;
    const { patientId } = referral.initiatingEncounter;
    const patient = patientById[patientId];
    const patientAdditionalData = patient.additionalData?.[0];
    const referralDate = format(referralSurveyResponse.endTime, 'dd-MM-yyyy');
    const { surveyId } = referralSurveyResponse;
    const surveyGroupKey = getSurveyGroupKey(surveyId);
    const age = patient.dateOfBirth ? ageInYears(patient.dateOfBirth) : '';

    const recordData = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      displayId: patient.displayId,
      age,
      gender: patient.sex,
      ethnicity: patientAdditionalData?.ethnicity?.name,
      contactNumber: patientAdditionalData?.primaryContactNumber,
      village: patient.village?.name,
      medicalArea: patientAdditionalData?.medicalArea?.name,
      nursingZone: patientAdditionalData?.nursingZone?.name,
      referralCreated: REFERRAL_NAME_BY_SURVEY_GROUP_KEY[surveyGroupKey],
    };

    const referralDataElements = getReferralDataElements(surveyGroupKey);
    Object.entries(referralDataElements).forEach(([dataKey, dataElementId]) => {
      recordData[dataKey] = getCachedAnswer(
        answersByPatientSurveyDataElement,
        patientId,
        surveyGroupKey,
        referralDate,
        dataElementId,
      );
    });

    const formDataElements = getFormDataElements(surveyGroupKey);
    Object.entries(formDataElements).forEach(([dataKey, dataElementId]) => {
      recordData[dataKey] = getCachedAnswer(
        answersByPatientSurveyDataElement,
        patientId,
        surveyGroupKey,
        referralDate,
        dataElementId,
      );
    });

    reportData.push(recordData);
  }

  const sortedReportData = reportData.sort(
    ({ dateOfReferral: date1 }, { dateOfReferral: date2 }) => {
      if (date2 && !date1) return 1;
      if (date1 && !date2) return -1;
      if (!date1 && !date2) return 0;

      // Sort oldest to most recent
      return parseISO(date1) - parseISO(date2);
    },
  );

  return generateReportFromQueryData(
    sortedReportData,
    PRIMARY_SCREENING_PENDING_REFERRALS_REPORT_COLUMN_TEMPLATE,
  );
};

export const permission = 'SurveyResponse';
