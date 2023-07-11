import { keyBy, groupBy, uniqWith, isEqual, upperFirst } from 'lodash';
import { parseISO } from 'date-fns';
import { Op } from 'sequelize';
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
import { ageInYears, format } from '../../utils/dateTime';

import {
  ALL_SURVEY_IDS,
  FORM_SURVEY_IDS,
  FORM_NAME_BY_SURVEY_GROUP_KEY,
  PRIMARY_SCREENING_REPORT_COLUMN_TEMPLATE,
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
    const referralDate = format(r.surveyResponse.endTime, 'dd-MM-yyyy');
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

  // Report should create a new line for each patient each time they have one of the below screening forms submitted:
  // CVD Primary Screening Form
  // Breast Cancer Primary Screening Form
  // Cervical Cancer Primary Screening Form
  // If there are multiple survey/referral submission on the same date, pull the latest answer for every data element regardless of which survey response
  // Referral details should be pulled into the report if they are submitted on the same day as the corresponding screening survey
  // Group the records by patient
  for (const [patientId, patientAnswers] of Object.entries(answersByPatientId)) {
    const screeningFormAnswers = patientAnswers.filter(a => FORM_SURVEY_IDS.includes(a.surveyId));
    const groupedScreeningFormAnswers = groupBy(screeningFormAnswers, a => {
      const responseDate = format(a.responseEndTime, 'dd-MM-yyyy');
      return `${getSurveyGroupKey(a.surveyId)}|${responseDate}`;
    });
    const patient = patientById[patientId];
    const patientAdditionalData = patient.additionalData?.[0];

    // Group the answers by survey and date. So for per patient per date, we should 1 row per survey (maximum 3 surveys)
    for (const [key] of Object.entries(groupedScreeningFormAnswers)) {
      const [surveyGroupKey, responseDate] = key.split('|');
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
        screeningCompleted: FORM_NAME_BY_SURVEY_GROUP_KEY[surveyGroupKey],
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
        recordData.referralStatus = upperFirst(referral.status);
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

  const sortedReportData = reportData.sort(
    ({ dateOfScreening: date1 }, { dateOfScreening: date2 }) => {
      if (date2 && !date1) return 1;
      if (date1 && !date2) return -1;
      if (!date1 && !date2) return 0;

      // Sort oldest to most recent
      return parseISO(date1) - parseISO(date2);
    },
  );

  return generateReportFromQueryData(sortedReportData, PRIMARY_SCREENING_REPORT_COLUMN_TEMPLATE);
};
