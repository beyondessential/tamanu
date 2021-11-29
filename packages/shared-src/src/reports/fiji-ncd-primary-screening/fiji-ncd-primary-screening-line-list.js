import { keyBy, groupBy, uniqWith, isEqual } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from '../utilities';
import {
  transformAndRemoveDuplicatedAnswersPerDate,
  getPatientById,
  removeDuplicatedReferralsPerDate,
  getSurveyGroupKey,
  getFormDataElements,
  getReferralDataElements,
  getAnswers,
  getPerPatientPerSurveyPerDatePerElementKey,
  getCachedAnswer,
  parametersToAnswerSqlWhere,
  getCvdRiskLevel,
} from './utils';

import {
  ALL_SURVEY_IDS,
  FORM_NAME_BY_SURVEY_GROUP_KEY,
  PRIMARY_SCREENING_REPORT_COLUMN_TEMPLATE,
  CVD_RISK_LEVEL_START_DATA_ELEMENT_ID,
  CVD_RISK_LEVEL_END_DATA_ELEMENT_ID,
} from './constants';

const getReferralByResponseIds = async (models, surveyResponseIds) =>
  models.Referral.findAll({
    where: {
      surveyResponseId: { [Op.in]: surveyResponseIds },
    },
    include: [
      {
        model: models.Encounter,
        as: 'initiatingEncounter',
      },
      {
        model: models.Encounter,
        as: 'completingEncounter',
      },
      {
        model: models.SurveyResponse,
        as: 'surveyResponse',
      },
    ],
  });

const getReferralByPatientSurveyAndDate = async (models, transformedAnswers) => {
  const responseIds = uniqWith(
    transformedAnswers.map(a => a.surveyResponseId),
    isEqual,
  );
  const referrals = await getReferralByResponseIds(models, responseIds);
  const finalReferrals = await removeDuplicatedReferralsPerDate(referrals);

  return keyBy(finalReferrals, r => {
    const referralDate = moment(r.surveyResponse.endTime).format('DD-MM-YYYY');
    const surveyGroupKey = getSurveyGroupKey(r.surveyResponse.surveyId);
    return `${r.initiatingEncounter.patientId}|${surveyGroupKey}|${referralDate}`;
  });
};

const getPerPatientPerSurveyPerDateKey = (patientId, surveyGroupKey, date) =>
  `${patientId}|${surveyGroupKey}|${date}`;

export const dataGenerator = async ({ models }, parameters = {}) => {
  const answerWhereClause = parametersToAnswerSqlWhere(parameters);
  const rawAnswers = await getAnswers(models, answerWhereClause);
  const filteredAnswers = await transformAndRemoveDuplicatedAnswersPerDate(
    models,
    rawAnswers,
    ALL_SURVEY_IDS,
  );
  const referralByPatientSurveyAndDate = await getReferralByPatientSurveyAndDate(
    models,
    filteredAnswers,
  );
  const patientById = await getPatientById(models, rawAnswers);
  const answersByPatientId = groupBy(filteredAnswers, a => a.patientId);
  const answersByPatientSurveyDataElement = keyBy(filteredAnswers, a => {
    const responseDate = moment(a.responseEndTime).format('DD-MM-YYYY');
    const surveyGroupKey = getSurveyGroupKey(a.surveyId);
    return getPerPatientPerSurveyPerDatePerElementKey(
      a.patientId,
      surveyGroupKey,
      responseDate,
      a.dataElementId,
    );
  });
  const reportData = [];

  // Report should create a new line for each patient each time they have one of the below screening forms submitted:
  // CVD Primary Screening Form
  // Breast Cancer Primary Screening Form
  // Cervical Cancer Primary Screening Form
  // If there are multiple survey/referral submission on the same date, pull the latest answer for every data element regardless of which survey response
  // Referral details should be pulled into the report if they are submitted on the same day as the corresponding screening survey
  // Group the records by patient
  for (const [patientId, patientAnswers] of Object.entries(answersByPatientId)) {
    const patientAnswersBySurveyGroupAndDate = groupBy(patientAnswers, a => {
      const responseDate = moment(a.responseEndTime).format('DD-MM-YYYY');
      return `${getSurveyGroupKey(a.surveyId)}|${responseDate}`;
    });
    const patient = patientById[patientId];
    const patientAdditionalData = patient.additionalData?.[0];

    // Group the answers by survey and date. So for per patient per date, we should 1 row per survey (maximum 3 surveys)
    for (const [key] of Object.entries(patientAnswersBySurveyGroupAndDate)) {
      const [surveyGroupKey, responseDate] = key.split('|');
      const dateOfBirthMoment = patient.dateOfBirth ?? moment(patient.dateOfBirth);
      const age = dateOfBirthMoment ? moment().diff(dateOfBirthMoment, 'years') : '';

      //cvdRiskLevel is either pde-FijCVD267 or pde-FijCVD1806
      const cvdRiskLevel = getCvdRiskLevel(
        answersByPatientSurveyDataElement,
        patientId,
        surveyGroupKey,
        responseDate,
      );
      const recordData = {
        firstName: patient.firstName,
        lastName: patient.lastName,
        displayId: patient.displayId,
        age: age,
        gender: patient.sex,
        ethnicity: patientAdditionalData?.ethnicity?.name,
        contactNumber: patientAdditionalData?.primaryContactNumber,
        screeningCompleted: FORM_NAME_BY_SURVEY_GROUP_KEY[surveyGroupKey],
        cvdRiskLevel,
      };

      const formDataElements = getFormDataElements(surveyGroupKey);
      Object.entries(formDataElements).forEach(([dataKey, dataElementId]) => {
        recordData[dataKey] = getCachedAnswer(
          answersByPatientSurveyDataElement,
          patientId,
          surveyGroupKey,
          responseDate,
          dataElementId,
        );
      });

      const referral =
        referralByPatientSurveyAndDate[
          getPerPatientPerSurveyPerDateKey(patientId, surveyGroupKey, responseDate)
        ];

      recordData.referralCreated = referral ? 'Yes' : 'No';

      // If referral has been created on the same date, populate the referral details
      if (referral) {
        recordData.referralStatus = referral.completingEncounter ? 'Complete' : 'Pending';
        const referralDataElements = getReferralDataElements(surveyGroupKey);
        Object.entries(referralDataElements).forEach(([dataKey, dataElementId]) => {
          recordData[dataKey] = getCachedAnswer(
            answersByPatientSurveyDataElement,
            patientId,
            surveyGroupKey,
            responseDate,
            dataElementId,
          );
        });
      }
      reportData.push(recordData);
    }
  }

  return generateReportFromQueryData(reportData, PRIMARY_SCREENING_REPORT_COLUMN_TEMPLATE);
};

export const permission = 'SurveyResponse';
