global.Promise = require('bluebird');
const xlsx = require('xlsx');
const { isNaN, isArray, has } = require('lodash');
const shortid = require('shortid');
const TYPES = require('./constants');
const { constructIsOneOf, hasContent } = require('./validation');

/**
* Responds to POST requests to the /surveys endpoint
*/
module.exports = function importSurveys(database, filePath, program) {
  const workbook = xlsx.readFile(filePath);
  try {
    const permissionGroup = { id: 'permission-group-id' };

    // Update projects
    if (typeof program.surveys !== 'object') program.surveys = [];

    // Go through each sheet, and make a survey for each
    const entries = Object.entries(workbook.Sheets);
    entries.forEach((surveySheets, order) => {
      const [surveyName, sheet] = surveySheets;

      // Get the survey based on the name of the sheet/tab
      const survey = database.create('survey', {
        _id: shortid.generate(),
        docType: TYPES.SURVEY,
        name: surveyName,
        canRedo: true,
        code: generateSurveyCode(surveyName),
        permissionGroupId: permissionGroup._id,
        order
      });

      program.surveys.push(survey);
      if (!isArray(survey.screens)) survey.screens = [];

      if (!survey) {
        throw new Error('creating survey, check format of import file');
      }

      // Delete all existing survey screens and components that were attached to this survey
      const questionObjects = xlsx.utils.sheet_to_json(sheet);
      if (!questionObjects || questionObjects.length === 0) {
        throw new Error('No questions listed in import file');
      }

      // Add all questions to the survey, creating screens, components and questions as required
      let currentScreen;
      let currentSurveyScreenComponent;
      const questionCodes = []; // An array to hold all qustion codes, allowing duplicate checking
      for (let rowIndex = 0; rowIndex < questionObjects.length; rowIndex += 1) {
        const questionObject = questionObjects[rowIndex];
        const excelRowNumber = rowIndex + 2; // +2 to make up for header and 0 index
        if (questionObject.code && questionObject.code.length > 0 && questionCodes.includes(questionObject.code)) {
          throw new Error('Question code is not unique', excelRowNumber);
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
          followUpAnswers,
        } = questionObject;

        let { params } = questionObject;
        if (params && params !== '') {
          params = params.split(',').map(param => param.trim());
        }

        // Either create or update the question depending on if there exists a matching code
        const question = database.create('question', {
          _id: shortid.generate(),
          code,
          type,
          indicator,
          text,
          detail,
          options: processOptions(options, optionLabels, optionColors),
          params,
        });

        // Generate the screen and screen component
        const shouldStartNewScreen = caseAndSpaceInsensitiveEquals(newScreen, 'yes');
        if (!currentScreen || shouldStartNewScreen) { // Spreadsheet indicates this question starts a new screen
          // Create a new survey screen
          currentScreen = database.create('surveyScreen', {
            _id: shortid.generate(),
            surveyId: survey._id,
            screenNumber: has(currentScreen, 'screenNumber') ? currentScreen.screenNumber + 1 : 1, // Next screen
          });

          // Clear existing survey screen component
          currentSurveyScreenComponent = undefined;
        }

        // Create a new survey screen component to display this question
        currentSurveyScreenComponent = database.create('surveyScreenComponent', {
          _id: shortid.generate(),
          // screen_id: currentScreen._id,
          componentNumber: currentSurveyScreenComponent ? currentSurveyScreenComponent.componentNumber + 1 : 1,
          isFollowUp: currentSurveyScreenComponent &&
                        ((currentSurveyScreenComponent.answersEnablingFollowUp && currentSurveyScreenComponent.answersEnablingFollowUp.length > 0) ||
                        currentSurveyScreenComponent.isFollowUp),
          answersEnablingFollowUp: splitOnCommas(followUpAnswers),
        });

        currentSurveyScreenComponent.question.push(question);

        // Update screen
        if (!isArray(currentScreen.components)) currentScreen.components = [];
        currentScreen.components.push(currentSurveyScreenComponent);
        survey.screens.push(currentScreen);
      }
      // Clear any orphaned questions (i.e. questions no longer included in a survey)
      database.create('survey', survey, true);
    });
  } catch (error) {
    if (error.respond) {
      throw error; // Already a custom error with a responder
    }
    console.error('importing surveys', error);
    throw new Error(error);
  }
  console.log('Surveys imported successfully!');
};

function generateSurveyCode(surveyName) {
  return surveyName.match(/\b(\w)/g).join('').toUpperCase();
}

function splitOnCommas(string) {
  function trimSegment(segment) { return segment.trim(); };
  return string ? string.split(',').map(trimSegment) : [];
}

function caseAndSpaceInsensitiveEquals(stringA = '', stringB = '') {
  return stringA.toLowerCase().trim() === stringB.toLowerCase().trim();
}

function processOptions(optionValuesString, optionLabelsString, optionColorsString) {
  const optionValues = splitOnCommas(optionValuesString);
  const optionLabels = splitOnCommas(optionLabelsString);
  const optionColors = splitOnCommas(optionColorsString);
  const options = [];
  for (let i = 0; i < optionValues.length; i += 1) {
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
    if (!isEmpty(cell) && splitOnCommas(cell).length <= 1) {
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
    constructIsOneOf(['Binary', 'Checkbox', 'FreeText', 'Geolocate', 'Instruction', 'Number', 'Photo', 'Radio', 'MultiColor', 'Date']),
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
      if (!isEmpty(cell) && splitOnCommas(cell).some((option) => option.length === 0)) {
        throw new Error('All options should be at least one character long');
      }
      return true;
    },
  ],
  optionLabels: [
    ...optionsValidators,
    (cell, row) => {
      if (splitOnCommas(cell).length > splitOnCommas(row.options).length) {
        throw new Error('There are more labels than options. Note that commas are separators and are not allowed in labels.');
      }
    },
  ],
  optionColors: [
    ...optionsValidators,
    (cell) => {
      const stringFormat = '#xxxxxx';
      if (!isEmpty(cell) && splitOnCommas(cell).some((color) =>
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
  followUpAnswers: [
    (cell, row) => {
      if (isEmpty(cell)) {
        return true; // No follow up answers defined, so is valid
      }
      const answers = splitOnCommas(cell);
      switch (row.type) {
        case 'MultiColor':
        case 'Radio':
          if (!answers.every((followUpAnswer) =>
            splitOnCommas(row.options).includes(followUpAnswer))) {
            throw new Error('Every follow up answer should be one of the options defined for the question');
          }
          break;
        case 'Binary':
          if (!answers.every((followUpAnswer) => isYesOrNo(followUpAnswer))) {
            throw new Error('All follow up answers for binary questions should be either Yes or No');
          }
          break;
        case 'Number':
          if (!answers.every((followUpAnswer) => !isNaN(followUpAnswer))) {
            throw new Error('All follow up answers to a number question should be numbers');
          }
          break;
        default:
          return true;
      }
      return true;
    }
  ],
};
