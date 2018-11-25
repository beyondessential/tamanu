/**
* Tupaia MediTrak
* Copyright (c) 2017 Beyond Essential Systems Pty Ltd
**/

import xlsx from 'xlsx';
import { compareTwoStrings } from 'string-similarity';
import { respond } from '../respond';
import { DatabaseError, UploadError, ImportValidationError, ValidationError } from '../errors';
import { deleteScreensForSurvey, deleteOrphanQuestions } from '../dataAccessors';
import { TYPES } from '../database';
import { PermissionGroup, Question } from '../models';
import { ObjectValidator, constructIsOneOf, hasContent, isNumber } from '../validation';

/**
* Responds to POST requests to the /surveys endpoint
*/
export async function importSurveys(req, res) {
  const { database } = req;
  if (!req.query || !req.query.surveyNames) {
    throw new ValidationError('HTTP query should contain surveyNames');
  }
  const requestedSurveyNames = splitStringOnComma(req.query.surveyNames);
  if (!req.file) {
    throw new UploadError();
  }
  const workbook = xlsx.readFile(req.file.path);
  const objectValidator = new ObjectValidator(FIELD_VALIDATORS);
  try {
    const permissionGroup = await PermissionGroup.findOne({ name: req.query.permissionGroup || 'Public' });
    if (!permissionGroup) {
      throw new DatabaseError('finding permission group');
    }

    let surveyGroup;
    if (req.query.surveyGroup) {
      surveyGroup = await database.findOrCreate(
        TYPES.SURVEY_GROUP,
        {
          name: req.query.surveyGroup,
        },
      );
    }

    // Go through each sheet, and make a survey for each
    for (const surveySheets of Object.entries(workbook.Sheets)) {
      const [tabName, sheet] = surveySheets;
      let surveyName = '';
      for (const requestedSurveyName of requestedSurveyNames) {
        // To deal with the character limit in Excel tabs, the tab name may be just the start of
        // the survey name, so we check for partial matches
        if (requestedSurveyName.startsWith(tabName) &&    // Test it at least partially matches &
            compareTwoStrings(requestedSurveyName, tabName) >
            compareTwoStrings(surveyName, tabName)) { // The existing match isn't closer
          surveyName = requestedSurveyName;
        }
      }
      if (surveyName.length === 0) {
        throw new ImportValidationError(`The tab ${tabName} was not listed as a survey name in the HTTP query`);
      }


      // Get the survey based on the name of the sheet/tab
      const survey = await database.findOrCreate(
        TYPES.SURVEY,
        {
          name: surveyName,
        },
        { // If no survey with that name is found, give it a code and public permissions
          code: generateSurveyCode(surveyName),
          permission_group_id: permissionGroup.id,
        }
      );
      if (!survey) {
        throw new DatabaseError('creating survey, check format of import file');
      }

      // Work out what fields of the survey should be updated based on query params
      const fieldsToForceUpdate = {};
      if (req.query.countryIds) {
        // Set the countries this survey is available in
        fieldsToForceUpdate.country_ids = splitStringOnComma(req.query.countryIds);
      }
      if (surveyGroup) {
        // Set the survey group this survey is attached to
        fieldsToForceUpdate.survey_group_id = surveyGroup.id;
      }
      if (req.query.permissionGroup) {
        // A non-default permission group was provided
        fieldsToForceUpdate.permission_group_id = permissionGroup.id;
      }
      if (req.query.surveyCode) {
        // Set or update the code for this survey
        fieldsToForceUpdate.code = req.query.surveyCode;
      }
      // Update the survey based on the fields to force update
      if (Object.keys(fieldsToForceUpdate).length > 0) {
        await database.updateById(
          TYPES.SURVEY,
          survey.id,
          fieldsToForceUpdate,
        );
      }


      // Delete all existing survey screens and components that were attached to this survey
      await deleteScreensForSurvey(database, survey.id);
      const questionObjects = xlsx.utils.sheet_to_json(sheet);
      if (!questionObjects || questionObjects.length === 0) {
        throw new ImportValidationError('No questions listed in import file');
      }

      // Add all questions to the survey, creating screens, components and questions as required
      let currentScreen;
      let currentSurveyScreenComponent;
      const questionCodes = []; // An array to hold all qustion codes, allowing duplicate checking
      for (let rowIndex = 0; rowIndex < questionObjects.length; rowIndex++) {
        const questionObject = questionObjects[rowIndex];
        const excelRowNumber = rowIndex + 2; // +2 to make up for header and 0 index
        const constructImportValidationError = (message, field) => new ImportValidationError(message, excelRowNumber, field, tabName);
        await objectValidator.validate(questionObject, constructImportValidationError);
        if (questionObject.code && questionObject.code.length > 0 && questionCodes.includes(questionObject.code)) {
          throw new ImportValidationError('Question code is not unique', excelRowNumber);
        }
        questionCodes.push(questionObject.code);

        // Extract question details from spreadsheet row
        const {
          code,
          type,
          indicator,
          text,
          detail,
          options,
          optionLabels,
          optionColors,
          newScreen,
          visibilityCriteria,
          validationCriteria,
        } = questionObject;

        // Compose question based on details from spreadsheet
        const questionToUpsert = {
          code,
          type,
          indicator,
          text,
          detail,
          options: processOptions(options, optionLabels, optionColors),
        };

        // Either create or update the question depending on if there exists a matching code
        let question;
        if (code) {
          question = await database.updateOrCreate(
            TYPES.QUESTION,
            { code },
            questionToUpsert,
          );
        } else { // No code in spreadsheet, can't match so just create a new question
          question = await database.create(
            TYPES.QUESTION,
            questionToUpsert,
          );
        }

        // Generate the screen and screen component
        const shouldStartNewScreen = caseAndSpaceInsensitiveEquals(newScreen, 'yes');
        if (!currentScreen || shouldStartNewScreen) { // Spreadsheet indicates this question starts a new screen
          // Create a new survey screen
          currentScreen = await database.create(
            TYPES.SURVEY_SCREEN,
            {
              survey_id: survey.id,
              screen_number: currentScreen ? currentScreen.screen_number + 1 : 1, // Next screen
            },
          );
          // Clear existing survey screen component
          currentSurveyScreenComponent = undefined;
        }

        // Create a new survey screen component to display this question
        const visibilityCriteriaObject = await convertCellToJson(visibilityCriteria, splitStringOnComma);
        const processedVisibilityCriteria = {};
        await Promise.all(Object.entries(visibilityCriteriaObject).map(async ([questionCode, answers]) => {
          if (questionCode === '_conjunction') {
            // This is the special _conjunction key, extract the 'and' or the 'or' from answers,
            // i.e. { conjunction: ['and'] } -> { conjunction: 'and' }
            processedVisibilityCriteria._conjunction = answers[0];
          } else {
            const { id: questionId } = await Question.findOne({ code: questionCode });
            processedVisibilityCriteria[questionId] = answers;
          }
        }));
        currentSurveyScreenComponent = await database.create(
          TYPES.SURVEY_SCREEN_COMPONENT,
          {
            screen_id: currentScreen.id,
            question_id: question.id,
            component_number: currentSurveyScreenComponent ?
              currentSurveyScreenComponent.component_number + 1 :
              1,
            visibility_criteria: JSON.stringify(processedVisibilityCriteria),
            validation_criteria: JSON.stringify(convertCellToJson(validationCriteria, processValidationCriteriaValue)),
          },
        );
      }
      // Clear any orphaned questions (i.e. questions no longer included in a survey)
      await deleteOrphanQuestions(database);
    }
  } catch (error) {
    if (error.respond) {
      throw error; // Already a custom error with a responder
    }
    throw new DatabaseError('importing surveys', error);
  }
  respond(res, { message: 'Imported surveys' });
}

function generateSurveyCode(surveyName) {
  return surveyName.match(/\b(\w)/g).join('').toUpperCase();
}

function splitOnNewLinesOrCommas(string) {
  if (!string) return [];
  return string.includes('\n') ? splitStringOn(string, '\n') : splitStringOnComma(string);
}

function splitStringOn(string, splitCharacter) {
  return string ? string.split(splitCharacter).map((segment) => segment.trim()) : [];
}

function splitStringOnComma(string) {
  return splitStringOn(string, ',');
}

/**
 * Converts an Excel cell string in the format
 * key: value
 * key: value
 * To a json object in the format
 * {
 *  key: value,
 *  key: value,
 * }
 * @param {string} cellString The string representing the cell in Excel
 */
function convertCellToJson(cellString, processValue = (value) => value) {
  const jsonObject = {};
  splitStringOn(cellString, '\n').forEach((line) => {
    const [key, value] = splitStringOn(line, ':');
    jsonObject[key] = processValue(value);
  });
  return jsonObject;
}

function caseAndSpaceInsensitiveEquals(stringA = '', stringB = '') {
  return stringA.toLowerCase().trim() === stringB.toLowerCase().trim();
}

function processOptions(optionValuesString, optionLabelsString, optionColorsString) {
  const optionValues = splitOnNewLinesOrCommas(optionValuesString);
  const optionLabels = splitOnNewLinesOrCommas(optionLabelsString);
  const optionColors = splitOnNewLinesOrCommas(optionColorsString);
  const options = [];
  for (let i = 0; i < optionValues.length; i++) {
    // If this option has either a custom label or custom colour, add it as a preconfigured object
    if (optionLabels.length > i || optionColors.length > i) {
      options.push({
        value: optionValues[i],
        label: optionLabels.length > i ? optionLabels[i] : optionValues[i],
        color: optionColors.length > i ? optionColors[i] : undefined,
      });
    } else {
      options.push(optionValues[i]); // No customisation, just add the text string
    }
  }
  return options;
}

/**
 * Converts the validation criteria value strings into more JS friendly values
 * e.g. mandatory: "Yes" becomes mandatory: true, and min: "40" becomes min: 40.0
 * @param {string} value The value to be processed
 */
function processValidationCriteriaValue(value) {
  const valueTranslations = {
    true: true,
    false: false,
  };
  if (valueTranslations[value] !== undefined) {
    return valueTranslations[value];
  }
  return parseFloat(value);
}

const VALID_QUESTION_TYPES = [
  'Binary',
  'Checkbox',
  'FreeText',
  'Geolocate',
  'Instruction',
  'Number',
  'Photo',
  'Radio',
  'Date',
  'DaysSince',
  'MonthsSince',
  'YearsSince',
];

const isEmpty = (cell) => cell === undefined || cell === null || cell.length === 0;
const isYesOrNo = (cell) => caseAndSpaceInsensitiveEquals(cell, 'yes') ||
                            caseAndSpaceInsensitiveEquals(cell, 'no');
const optionsValidators = [
  (cell, row) => {
    if (!isEmpty(cell) && row.type !== 'Radio') {
      throw new Error('Only radio type questions should have content in options');
    }
    return true;
  },
  (cell) => {
    if (!isEmpty(cell) && splitOnNewLinesOrCommas(cell).length <= 1) {
      throw new Error('When defining options, include at least two separated by a comma');
    }
    return true;
  },
];
const DHIS_MAX_NAME_LENGTH = 230; // In DHIS2, the field is capped at 230 characters
const FIELD_VALIDATORS = {
  code: [
    (cell, row) => { // Not required for Instruction lines
      if (row.type === 'Instruction') {
        return true;
      }
      return hasContent(cell);
    },
  ],
  type: [
    hasContent,
    constructIsOneOf(VALID_QUESTION_TYPES),
  ],
  indicator: [
    (cell, questionObject) => { // Not required for Instruction lines
      if (questionObject.type === 'Instruction') {
        return true;
      }
      return hasContent(cell);
    },
    (cell) => {
      if (cell && cell.length > DHIS_MAX_NAME_LENGTH) {
        throw new Error(`Question indicators must be shorter than ${DHIS_MAX_NAME_LENGTH} characters`);
      }
      return true;
    },
  ],
  text: [
    hasContent,
  ],
  detail: [
  ],
  options: [
    ...optionsValidators,
    (cell, row) => {
      if (row.type === 'Radio' && isEmpty(cell)) {
        throw new Error('All radio questions should have a defined list of options');
      }
      return true;
    },
    (cell) => {
      if (!isEmpty(cell) && splitOnNewLinesOrCommas(cell).some((option) => option.length === 0)) {
        throw new Error('All options should be at least one character long');
      }
      return true;
    },
  ],
  optionLabels: [
    ...optionsValidators,
    (cell, row) => {
      if (splitOnNewLinesOrCommas(cell).length > splitOnNewLinesOrCommas(row.options).length) {
        throw new Error(
          'There are more labels than options.'
        );
      }
    },
  ],
  optionColors: [
    ...optionsValidators,
    (cell) => {
      const stringFormat = '#xxxxxx';
      if (!isEmpty(cell) && splitOnNewLinesOrCommas(cell).some((color) =>
        !color.startsWith('#') || color.length !== stringFormat.length)) {
        throw new Error(`Option colors must be valid hex values in the format ${stringFormat}`);
      }
      return true;
    },
  ],
  newScreen: [
    (cell) => {
      if (!isEmpty(cell) && !isYesOrNo(cell)) {
        throw new Error('The newScreen field should contain either Yes or No or be empty');
      }
      return true;
    }
  ],
  visibilityCriteria: [
    async (cell) => {
      if (isEmpty(cell)) {
        return true; // No follow up answers defined, so is valid
      }
      const criteria = Object.entries(convertCellToJson(cell, splitStringOnComma));
      for (let i = 0; i < criteria.length; i++) {
        const [questionCode, answers] = criteria[i];
        if (questionCode === '_conjunction') {
          if (answers !== ['and'] && answers === ['or']) {
            throw new Error('Visibility criteria conjunction must be either "and" or "or"');
          }
        } else {
          const question = await Question.findOne({ code: questionCode });
          switch (question.type) {
            case 'Radio':
              if (!answers.every((answer) =>
                question.options.some((option) => {
                  if (option === answer) {
                    return true;
                  }
                  // The option may be a JSON string in the form { value: x, ... }
                  try {
                    if (JSON.parse(option).value === answer){
                      return true;
                    }
                  } catch (error) {
                    return false;
                  }
                  return false;
                }))) {
                throw new Error('Every answer in the visibility criteria should be one of the options defined for the question');
              }
              break;
            case 'Binary':
              if (!answers.every((answer) => isYesOrNo(answer))) {
                throw new Error('All answers in the visibility criteria for binary questions should be either Yes or No');
              }
              break;
            case 'Number':
              if (!answers.every((answer) => !isNaN(answer))) {
                throw new Error('All answers in the visibility criteria for a number question should be numbers');
              }
              break;
            default:
              return true;
          }
        }
      }
      return true;
    }
  ],
  validationCriteria: [
    (cell) => {
      const VALIDATION_CRITERIA_VALIDATORS = {
        mandatory: (value) => {
          if (!['true', 'false'].includes(value)) {
            throw new Error('The validation criteria "mandatory" must be either true or false');
          }
        },
        min: isNumber,
        max: isNumber,
      };
      if (isEmpty(cell)) {
        return true; // No validation criteria defined, so is valid
      }
      const criteria = Object.entries(convertCellToJson(cell));
      criteria.forEach(([key, value]) => {
        if (VALIDATION_CRITERIA_VALIDATORS[key] === undefined) {
          throw new Error(`Validation criteria can only be one of ${Object.keys(VALIDATION_CRITERIA_VALIDATORS)}`);
        }
        VALIDATION_CRITERIA_VALIDATORS[key](value);
      });
      return true;
    }
  ]
};
