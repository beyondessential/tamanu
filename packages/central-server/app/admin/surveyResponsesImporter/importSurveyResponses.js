import { utils } from 'xlsx';
import { getJsDateFromExcel } from 'excel-date-to-js';

import { PROGRAM_DATA_ELEMENT_TYPES, NON_ANSWERABLE_DATA_ELEMENT_TYPES } from '@tamanu/constants';

import { checkJSONCriteria } from '@tamanu/shared/utils/criteria';
import { checkVisibilityCriteria } from '@tamanu/shared/utils/fields';
import { toDateString, toDateTimeString } from '@tamanu/shared/utils/dateTime';

import { statkey, updateStat } from '../stats';
import { DataLoaderError, ValidationError, WorkSheetError } from '../errors';

const checkMandatory = (mandatory, values) => {
  try {
    if (!mandatory) {
      return false;
    }
    if (typeof mandatory === 'boolean') {
      return mandatory;
    }

    return checkJSONCriteria(JSON.stringify(mandatory), [], values);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(
      `Failed to use mandatory in validationCriteria: ${JSON.stringify(mandatory)}, error: ${
        error.message
      }`,
    );
    return false;
  }
};

function getConfigObject(config, componentId) {
  if (!config) return {};
  try {
    return JSON.parse(config);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`Invalid config in survey screen component ${componentId}`);
    return {};
  }
}

const getModelFromConfigType = config => {
  if (config?.source === 'ReferenceData') {
    if (config?.where?.type === 'facility') return 'Facility';
    if (config?.where?.type === 'location') return 'Location';
    if (config?.where?.type === 'locationGroup') return 'LocationGroup';
    if (config?.where?.type === 'department') return 'Department';
    if (config?.where?.type === 'practitioner') return 'User';
    return 'ReferenceData';
  }
  return config?.source;
};

const getAnswerValue = async ({
  answerText,
  facilityId,
  screenComponent,
  validationCriteria,
  options,
  models,
}) => {
  let answer = answerText;

  if (screenComponent.dataElement.type === PROGRAM_DATA_ELEMENT_TYPES.NUMBER) {
    const validationMin = parseFloat(validationCriteria.min);
    const validationMax = parseFloat(validationCriteria.max);
    answer = parseFloat(answer);
    if (
      (!isNaN(validationMin) && answer < validationMin) ||
      (!isNaN(validationMax) && answer > validationMax)
    ) {
      throw new Error(`Value must be between ${validationMin} and ${validationMax}`);
    }
    return answer;
  }

  if (!answer) return answer;

  switch (screenComponent.dataElement.type) {
    case PROGRAM_DATA_ELEMENT_TYPES.SELECT:
    case PROGRAM_DATA_ELEMENT_TYPES.RADIO:
      if (
        Object.keys(options).length > 0 &&
        !Object.keys(options).includes(answer) &&
        !Object.keys(options).includes(answer.toString())
      )
        throw new Error(`Value must be one of ${Object.keys(options)}`);
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT:
      if (
        Object.keys(options).length > 0 &&
        answer.split(',').filter(a => !Object.keys(options).includes(a.trim())).length > 0
      ) {
        throw new Error(`Values must be one of ${Object.keys(options)}`);
      }
      answer = JSON.stringify(answer.split(','));
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.DATE_TIME:
    case PROGRAM_DATA_ELEMENT_TYPES.SUBMISSION_DATE:
      answer = toDateTimeString(getJsDateFromExcel(answer)); // this throws an error if invalid
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.DATE:
      answer = toDateString(getJsDateFromExcel(answer)); // this throws an error if invalid
      break;
    case PROGRAM_DATA_ELEMENT_TYPES.AUTOCOMPLETE: {
      const config = getConfigObject(screenComponent.config, screenComponent.id);
      const modelName = getModelFromConfigType(config);
      if (!models[modelName])
        throw new Error(`Survey Screen Component error in config: no such model "${modelName}"`);
      const referencedData = await models[modelName].findByPk(answer, { paranoid: false });
      if (!referencedData) throw new Error(`No such data "${answer}" in reference table`);
      if (
        modelName === 'LocationGroup' &&
        config?.scope !== 'allFacilities' &&
        referencedData.facilityId !== facilityId
      )
        throw new Error(`Location Group "${answer}" is not in current facility`);
      break;
    }
    default:
      break;
  }

  return answer;
};

export async function validateResponseAnswer({
  surveyResponseAnswers,
  screenComponent,
  screenComponents,
  models,
  facilityId,
}) {
  if (NON_ANSWERABLE_DATA_ELEMENT_TYPES.includes(screenComponent.dataElement.type))
    return undefined;

  const answer = surveyResponseAnswers[screenComponent.dataElement.code];

  const isComponentVisible = checkVisibilityCriteria(
    screenComponent,
    screenComponents,
    surveyResponseAnswers,
  );

  const validationCriteria = getConfigObject(
    screenComponent.validationCriteria,
    screenComponent.id,
  );

  const options = getConfigObject(
    screenComponent.options || screenComponent.dataElement.defaultOptions,
    screenComponent.id,
  );

  if (
    isComponentVisible &&
    checkMandatory(validationCriteria.mandatory, surveyResponseAnswers) &&
    !answer &&
    // Decision to allow blank mandatory if type of question is empty options
    // select / radio / multiselect to avoid blocking imports
    // https://linear.app/bes/issue/SAV-299/build-importer-for-historical-survey-responses#comment-e622a33b
    (![
      PROGRAM_DATA_ELEMENT_TYPES.SELECT,
      PROGRAM_DATA_ELEMENT_TYPES.RADIO,
      PROGRAM_DATA_ELEMENT_TYPES.MULTI_SELECT,
    ].includes(screenComponent.dataElement.type) ||
      Object.keys(options).length > 0)
  ) {
    throw new Error(`Value is mandatory`);
  }

  return getAnswerValue({
    answerText: answer,
    facilityId,
    screenComponent,
    validationCriteria,
    options,
    models,
  });
}

const obtainSurveyQuestions = async ({ models, surveyCode }) => {
  if (!surveyCode) throw new Error(`Must specify "surveyCode"`);
  const survey = await models.Survey.findOne({ where: { code: surveyCode } }, { paranoid: false });
  if (!survey) throw new Error(`Survey with code "${surveyCode}" does not exist`);

  return survey;
};

const prevalidateRow = async ({
  models,
  patientId,
  examinerId,
  submittedById,
  departmentId,
  locationId,
  dateSubmitted,
}) => {
  const errors = [];

  let dateSubmittedString;
  if (dateSubmitted) {
    dateSubmittedString = toDateTimeString(getJsDateFromExcel(dateSubmitted)); // throws error if invalid
  }

  const [patient, examiner, user, department, location] = await Promise.all([
    models.Patient.findByPk(patientId),
    examinerId && models.User.findByPk(examinerId),
    models.User.findByPk(submittedById),
    models.Department.findByPk(departmentId),
    models.Location.findByPk(locationId),
  ]);

  if (!patient) errors.push(new Error(`Patient with ID "${patientId}" does not exist`));
  if (examinerId && !examiner)
    errors.push(new Error(`Examiner (User) with ID "${examinerId}" does not exist`));
  if (!user) errors.push(new Error(`Submitting User with ID "${submittedById}" does not exist`));
  if (!department) errors.push(new Error(`Department with ID "${departmentId}" does not exist`));
  if (!location) errors.push(new Error(`Location with ID "${locationId}" does not exist`));

  if (errors.length) throw errors;

  return {
    patient,
    examiner,
    user,
    department,
    location,
    dateSubmittedString,
  };
};

export async function importSurveyResponses(workbook, { errors, log, models }) {
  const stats = {};
  const sheetName = 'Survey Responses';
  const surveyResponsesSheet = workbook.Sheets[sheetName];
  log.debug(`Checking for ${sheetName} sheet`);
  if (!surveyResponsesSheet)
    throw new Error(`A survey responses workbook must have a sheet named "${sheetName}"`);

  log.debug('Loading rows from sheet');
  let sheetRows;
  try {
    sheetRows = utils.sheet_to_json(surveyResponsesSheet);
  } catch (err) {
    throw new WorkSheetError(sheetName, 0, err);
  }
  if (sheetRows.length === 0) {
    throw new Error('Sheet is empty');
  }

  const surveyScreenComponents = {};

  for (const [sheetRow, data] of sheetRows.entries()) {
    const trimmed = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key.trim(), value]),
    );

    const {
      patientId,
      examinerId,
      submittedBy: submittedById,
      departmentId,
      locationId,
      surveyCode,
      dateSubmitted,
      ...surveyResponseAnswers // these are structured by code as key
    } = trimmed;

    const initialValidationErrors = [];

    let survey;

    try {
      survey = await obtainSurveyQuestions({ models, surveyCode });

      if (!surveyScreenComponents[surveyCode]) {
        log.debug(`Loading survey screen components from DB for survey with code "${surveyCode}"`);
        surveyScreenComponents[
          surveyCode
        ] = await models.SurveyScreenComponent.getComponentsForSurvey(survey.id, {
          includeAllVitals: true,
        });
      }
    } catch (e) {
      // no survey or error getting components
      const errs = Array.isArray(e) ? e : [e];
      initialValidationErrors.push(
        ...errs.map(error => new ValidationError(sheetName, sheetRow, error.message)),
      );
    }

    let examiner;
    let dateSubmittedString;
    let location;

    try {
      ({ examiner, location, dateSubmittedString } = await prevalidateRow({
        models,
        patientId,
        examinerId,
        submittedById,
        departmentId,
        locationId,
        surveyCode,
        dateSubmitted,
        surveyScreenComponents,
      }));
    } catch (e) {
      // prevalidation errors
      const errs = Array.isArray(e) ? e : [e];
      initialValidationErrors.push(
        ...errs.map(error => new ValidationError(sheetName, sheetRow, error.message)),
      );
    }

    if (initialValidationErrors.length) {
      errors.push(...initialValidationErrors);
      continue;
    }

    try {
      const answers = {};

      const validationErrors = [];

      for (const screenComponent of surveyScreenComponents[surveyCode]) {
        try {
          const answer = await validateResponseAnswer({
            surveyResponseAnswers,
            screenComponent,
            screenComponents: surveyScreenComponents[surveyCode],
            models,
            facilityId: location.facilityId,
          });
          if (answer) answers[screenComponent.dataElement.id] = answer;
        } catch (err) {
          validationErrors.push(
            new ValidationError(
              sheetName,
              sheetRow,
              `${screenComponent.dataElement.code}: ${err.message}`,
            ),
          );
        }
      }

      if (validationErrors.length) throw validationErrors;

      await models.SurveyResponse.createWithAnswers({
        answers,
        surveyId: survey.id,
        userId: submittedById,
        patientId,
        departmentId,
        locationId,
        ...(examiner && { examinerId }),
        ...(dateSubmittedString && {
          startTime: dateSubmittedString,
          endTime: dateSubmittedString,
        }),
        forceNewEncounter: true,
      });
      updateStat(stats, statkey('SurveyResponse', sheetName), 'created');
      updateStat(
        stats,
        statkey('SurveyResponseAnswer', sheetName),
        'created',
        Object.keys(answers).length,
      );
    } catch (e) {
      if (Array.isArray(e)) {
        errors.push(...e);
      } else {
        errors.push(new DataLoaderError(sheetName, sheetRow, e));
      }
    }
  }

  return stats;
}
