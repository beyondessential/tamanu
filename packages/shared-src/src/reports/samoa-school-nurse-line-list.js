import { keyBy, groupBy } from 'lodash';
import { Op } from 'sequelize';
import moment from 'moment';
import { generateReportFromQueryData } from './utilities';

const ADD_MOBILITY_PRODUCT_SURVEY_CODE = 'program-samoancdscreening-sampensnpass';
const SELF_CARE_PRODUCT_SURVEY_CODE = 'program-samoancdscreening-sampensnpref';

const SURVEY_CODES = [ADD_MOBILITY_PRODUCT_SURVEY_CODE, SELF_CARE_PRODUCT_SURVEY_CODE];

const SURVEY_DATA_ELEMENT_IDS = {
  screeningDate: 'pde-samsnpASS3',
  nameOfSchool: 'pde-samsnpASS4',
  classGrade: 'pde-samsnpASS5',
  ageCompletedYears: 'pde-samsnpASS6',
  ageCompletedMonths: 'pde-samsnpASS7',
  weight: 'pde-samsnpASS9',
  height: 'pde-samsnpASS10',
  bmi: 'pde-samsnpASS11',
  waistCircumference: 'pde-samsnpASS27',
  nutrition: 'pde-samsnpASS20',
  finalNutritionClassification: '$result',
  midUpperArmCircumference: 'pde-samsnpASS26',
  referralTo: 'pde-samsnpREF-5',
  fillerName: 'pde-samsnpASS35',
  fillerDesignation: 'pde-samsnpASS36',
  referralBy: 'pde-ReferredBy',
  referralFillerDesignation: 'pde-samsnpREF-7',
};

const reportColumnTemplate = [
  {
    title: 'First name',
    accessor: data => data.firstName,
  },
  {
    title: 'Last name',
    accessor: data => data.lastName,
  },
  {
    title: 'Display ID',
    accessor: data => data.displayId,
  },
  {
    title: 'Date of Birth',
    accessor: data => data.dateOfBirth,
  },
  {
    title: 'Sex',
    accessor: data => data.sex,
  },
  {
    title: 'Village',
    accessor: data => data.village,
  },
  {
    title: 'Age (completed years)',
    accessor: data => data.ageCompletedYears,
  },
  {
    title: 'Age (completed months)',
    accessor: data => data.ageCompletedMonths,
  },
  { title: 'ScreeningDate', accessor: data => data.screeningDate },
  { title: 'Name of school', accessor: data => data.nameOfSchool },

  {
    title: 'Class/Grade',
    accessor: data => data.classGrade,
  },
  {
    title: 'Weight (kg)',
    accessor: data => data.weight,
  },
  {
    title: 'Height (cm)',
    accessor: data => data.height,
  },
  {
    title: 'BMI',
    accessor: data => data.bmi,
  },
  {
    title: 'Nutrition classification (z-score)',
    accessor: data => data.nutrition,
  },
  {
    title: 'Final nutrition classification',
    accessor: data => data.finalNutritionClassification,
  },
  {
    title: 'Mid upper arm circumference (MUAC) (mm)',
    accessor: data => data.midUpperArmCircumference,
  },
  {
    title: 'Waist circumference (cm)',
    accessor: data => data.waistCircumference,
  },
  {
    title: 'Name of person completing form',
    accessor: data => data.fillerName,
  },
  {
    title: 'Designation of person completing form',
    accessor: data => data.fillerDesignation,
  },

  { title: 'Referral date', accessor: data => data.referralDate },

  { title: 'Referral to', accessor: data => data.referralTo },
  {
    title: 'Referral completed by',
    accessor: data => data.referralBy,
  },
  {
    title: 'Designation of person completing form',
    accessor: data => data.referralFillerDesignation,
  },
];

const parametersToSurveyResponseSqlWhere = parameters => {
  const whereClause = Object.entries(parameters)
    .filter(([, val]) => val)
    .reduce(
      (where, [key, value]) => {
        switch (key) {
          case 'fromDate':
            if (!where['$surveyResponse.end_time$']) {
              where['$surveyResponse.end_time$'] = {};
            }
            where['$surveyResponse.end_time$'][Op.gte] = value;
            break;
          case 'toDate':
            if (!where['$surveyResponse.end_time$']) {
              where['$surveyResponse.end_time$'] = {};
            }
            where['$surveyResponse.end_time$'][Op.lte] = value;
            break;
          default:
            break;
        }
        return where;
      },
      {
        '$surveyResponse.survey_id$': SURVEY_CODES,
      },
    );

  return whereClause;
};

const MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE = {
  User: 'displayName',
  ReferenceData: 'name',
};

const formatDate = date => {
  return moment(date).format('DD-MM-YYYY');
};

const getTransformedAnswers = async (models, surveyResponseAnswers, surveyComponents) => {
  const autocompleteComponents = surveyComponents
    .filter(c => c.dataElement.dataValues.type === 'Autocomplete')
    .map(({ dataElementId, config: componentConfig }) => [
      dataElementId,
      JSON.parse(componentConfig),
    ]);
  const dateDataElementIds = surveyComponents
    .filter(c => ['Date', 'SubmissionDate'].includes(c.dataElement.dataValues.type))
    .map(component => component.dataElementId);
  const autocompleteComponentMap = new Map(autocompleteComponents);

  // Transform Autocomplete answers from: ReferenceData.id to ReferenceData.name
  const transformedAnswers = await Promise.all(
    surveyResponseAnswers
      // Some questions in the front end are not answered but still record the answer as empty string in the database
      // So we should filter any answers thare are empty.
      .filter(answer => answer.body !== null && answer.body !== undefined && answer.body !== '')
      .map(async answer => {
        const surveyResponseId = answer.surveyResponse?.id;
        const patientId = answer.surveyResponse?.encounter?.patientId;
        const responseEndTime = answer.surveyResponse?.endTime;
        const referralTime = answer.surveyResponse?.referral?.createdAt;
        const { dataElementId } = answer;
        const body =
          dateDataElementIds.includes(dataElementId) && answer.body
            ? formatDate(answer?.body)
            : answer.body;
        const componentConfig = autocompleteComponentMap.get(dataElementId);

        const returnObj = {
          surveyResponseId,
          surveyResponse: answer.surveyResponse,
          patientId,
          responseEndTime,
          referralTime,
          dataElementId,
          body,
        };

        if (!componentConfig) {
          return returnObj;
        }

        const result = await models[componentConfig.source]?.findByPk(body);
        if (!result) {
          return returnObj;
        }

        const answerDisplayValue =
          result[MODEL_COLUMN_TO_ANSWER_DISPLAY_VALUE[componentConfig.source]];
        return {
          ...returnObj,
          body: answerDisplayValue,
        };
      }),
  );

  return transformedAnswers;
};

const getAnswers = async (models, parameters) => {
  return models.SurveyResponseAnswer.findAll({
    where: {
      ...parametersToSurveyResponseSqlWhere(parameters),
      body: {
        [Op.not]: '',
      },
    },
    include: [
      {
        model: models.SurveyResponse,
        as: 'surveyResponse',
        include: [
          {
            model: models.Encounter,
            as: 'encounter',
            include: [
              {
                model: models.Patient,
                as: 'patient',
              },
            ],
          },
        ],
        order: [['end_time', 'ASC']],
      },
    ],
  });
};

const getKey = (patientId, dataElementId) => `${patientId}|${dataElementId}`;

const getLatestAnswerPerDataElement = transformedAnswers => {
  const seenSurveyResponseIds = new Set();
  // const surveyResponses = transformedAnswers.map(a => a.surveyResponse);
  const surveyResponses = transformedAnswers
    .map(a => a.surveyResponse)
    .filter(({ id }) => {
      if (seenSurveyResponseIds.has(id)) {
        return false;
      }
      seenSurveyResponseIds.add(id);
      return true;
    });
  const transformedAnswersIncResults = [
    ...transformedAnswers,
    ...surveyResponses
      .map(sr => ({
        dataElementId: '$result',
        patientId: sr.encounter.patientId,
        responseEndTime: sr.endTime,
        body: sr.resultText || sr.result,
      }))
      .filter(({ body }) => !!body),
  ];

  const groupedTransformAnswers = groupBy(transformedAnswersIncResults, a =>
    getKey(a.patientId, a.dataElementId),
  );
  const result = {};
  for (const [key, groupedAnswers] of Object.entries(groupedTransformAnswers)) {
    const sortedLatestToOldestAnswers = groupedAnswers.sort((a1, a2) =>
      moment(a2.responseEndTime).diff(moment(a1.responseEndTime)),
    );
    result[key] = sortedLatestToOldestAnswers[0];
  }
  return result;
};

export const dataGenerator = async ({ models }, parameters = {}) => {
  const answers = await getAnswers(models, parameters);
  const components = await models.SurveyScreenComponent.getComponentsForSurveys(SURVEY_CODES);
  const transformedAnswers = await getTransformedAnswers(models, answers, components);
  const surveyResponseIds = transformedAnswers.map(a => a.surveyResponseId);
  const latestAnswerPerDataElement = getLatestAnswerPerDataElement(transformedAnswers);
  const patients = answers.map(a => a.surveyResponse?.encounter?.patient);
  const patientById = keyBy(patients, 'id');
  const reportData = [];

  const referrals = await models.Referral.findAll({
    where: {
      surveyResponseId: { [Op.in]: surveyResponseIds },
    },
    include: [
      {
        model: models.Encounter,
        as: 'initiatingEncounter',
      },
    ],
  });
  const referralBySurveyResponseId = keyBy(referrals, 'surveyResponseId');
  for (const [patientId, patient] of Object.entries(patientById)) {
    const dateOfBirth = patient.dateOfBirth ? moment(patient.dateOfBirth).format('DD-MM-YYYY') : '';
    const recordData = {
      firstName: patient.firstName,
      lastName: patient.lastName,
      displayId: patient.displayId,
      dateOfBirth,
      sex: patient.sex,
      village: patient.villageId,
    };
    let surveyResponseId;
    Object.entries(SURVEY_DATA_ELEMENT_IDS).forEach(([key, dataElementId]) => {
      const latestAnswer = latestAnswerPerDataElement[getKey(patientId, dataElementId)];
      recordData[key] = latestAnswer?.body;
      surveyResponseId = latestAnswer?.surveyResponseId;
    });
    const referral = referralBySurveyResponseId[surveyResponseId];
    recordData.referralDate = referral?.initiatingEncounter?.startDate
      ? formatDate(referral?.initiatingEncounter?.startDate)
      : '';
    reportData.push(recordData);
  }

  return generateReportFromQueryData(reportData, reportColumnTemplate);
};

export const permission = 'SurveyResponse';
