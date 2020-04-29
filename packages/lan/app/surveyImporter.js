import { readFile, utils } from 'xlsx';
import shortid from 'shortid';

const yesOrNo = value => !!(value && value.toLowerCase() === 'yes');

function newlinesToArray(data) {
  if (!data) return null;

  const array = data.split(/[\r\n]+/g);
  return JSON.stringify(array);
}

function importQuestion(row) {
  // Extract question details from spreadsheet row
  //
  // # columns in spreadsheet
  // ## imported directly
  // code
  // type
  // indicator
  // text
  // detail
  //
  // ## booleans
  // newScreen
  //
  // ## arrays
  // options
  // optionLabels
  //
  // ## not handled yet
  // config
  // optionColors
  // visibilityCriteria
  // validationCriteria
  // optionSet
  // questionLabel
  // detailLabel

  const { newScreen, options, optionLabels, ...rest } = row;

  return {
    newScreen: yesOrNo(newScreen),
    options: newlinesToArray(options),
    optionLabels: newlinesToArray(optionLabels),
    ...rest,
  };
}

function splitIntoScreens(questions) {
  const screenStarts = questions
    .map((q, i) => ({ newScreen: q.newScreen, i }))
    .filter(q => q.i === 0 || q.newScreen)
    .concat([{ i: questions.length }]);

  return screenStarts.slice(0, -1).map((q, i) => {
    const start = q.i;
    const end = screenStarts[i + 1].i;
    return {
      questions: questions.slice(start, end),
    };
  });
}

function importSheet(sheet) {
  const data = utils.sheet_to_json(sheet);
  const questions = data.map(importQuestion).filter(q => q.code);

  const survey = {
    screens: splitIntoScreens(questions),
  };

  return survey;
}

export function readSurveyXSLX(surveyName, path) {
  const workbook = readFile(path);
  const sheets = Object.values(workbook.Sheets);

  if (sheets.length > 1) {
    throw new Error('A survey workbook may only contain one sheet');
  }

  return {
    name: surveyName,
    ...importSheet(sheets[0]),
  };
}

function writeQuestion(db, survey, questionData) {
  const question = db.create('surveyQuestion', {
    _id: shortid.generate(),
    options: '',
    ...questionData,
  });

  return question;
}

function writeScreen(db, survey, { questions }) {
  const screen = db.create('surveyScreen', {
    _id: shortid.generate(),
    surveyId: survey._id,
  });

  const components = questions.map((q, i) => {
    const question = writeQuestion(db, survey, q);
    const component = db.create('surveyScreenComponent', {
      _id: shortid.generate(),
      questions: [question],
      componentNumber: i,
    });
    return component;
  });

  screen.components = components;

  return screen;
}

export function writeSurveyToDatabase(db, program, { screens, ...surveyData }) {
  const survey = db.create('survey', {
    _id: shortid.generate(),
    ...surveyData,
  });

  survey.screens = screens.map((s, i) => writeScreen(db, survey, { index: i, ...s }));

  program.surveys = [...program.surveys, survey];

  return survey;
}

export function writeProgramToDatabase(db, programData) {
  const program = db.create('program', {
    _id: shortid.generate(),
    ...programData,
  });

  return program;
}
