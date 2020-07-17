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

async function writeQuestion({ SurveyQuestion }, survey, questionData) {
  return SurveyQuestion.create({
    options: '',
    ...questionData,
  });
}

async function writeScreen(models, survey, { screenIndex, questions }) {
  const componentTasks = questions.map(async (q, i) => {
    const question = await writeQuestion(models, survey, q);
    const component = await models.SurveyScreenComponent.create({
      surveyId: survey.id,
      questionId: question.id,
      screenIndex,
      componentIndex: i,
    });
    return component;
  });

  return Promise.all(componentTasks);
}

export async function writeSurveyToDatabase(models, program, { screens, ...surveyData }) {
  const survey = await models.Survey.create({
    ...surveyData,
    programId: program.id,
  });

  const screenTasks = screens.map((s, i) => writeScreen(models, survey, {
    screenIndex: i,
    ...s 
  }));

  await Promise.all(screenTasks);

  return survey;
}

export async function writeProgramToDatabase(models, programData) {
  const program = await models.Program.create(programData);

  return program;
}
