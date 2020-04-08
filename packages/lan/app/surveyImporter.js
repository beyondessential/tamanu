import { readFile, utils } from 'xlsx';
import shortid from 'shortid';

function generateSurveyCode(name) {
  return 'XX';
}

const yesOrNo = value => !!(value && value.toLowerCase() === 'yes');

function importQuestion(row) {
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
  } = row;

  return {
    code,
    text,
    type,
    newScreen: yesOrNo(newScreen),
  };
}

function splitIntoScreens(questions) {
  const screenStarts = questions
    .map((q, i) => ({ newScreen: q.newScreen, i }))
    .filter(q => q.i === 0 || q.newScreen)
    .concat([{ i: questions.length }]);

  return screenStarts
    .slice(0, -1)
    .map((q, i) => {
      const start = q.i;
      const end = screenStarts[i + 1].i;
      return {
        questions: questions.slice(start, end),
      };
    });
}

function importSheet(name, sheet) {
  const data = utils.sheet_to_json(sheet);
  const questions = data
    .map(importQuestion)
    .filter(q => q.code);

  const survey = {
    name, 
    canRedo: true,
    code: generateSurveyCode(name),
    screens: splitIntoScreens(questions),
  };

  return survey;
}

export function readSurveyXSLX(path) {
  const workbook = readFile(path);
  const sheets = Object.entries(workbook.Sheets);
  const surveys = sheets.map(([name, data]) => importSheet(name, data));
  return { 
    surveys
  };
}

function writeQuestion(db, survey, questionData) {
  const question = db.create('surveyQuestion', {
    _id: shortid.generate(),
    ...questionData,
  });

  return question;
}

function writeScreen(db, survey, { questions, ...screenData }) {
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

function writeSurvey(db, program, { screens, ...surveyData }) {
  const survey = db.create('survey', {
    _id: shortid.generate(),
    ...surveyData,
  });

  survey.screens = screens.map((s, i) => writeScreen(db, survey, { index: i, ...s }));

  return survey;
}

export function writeProgramToDatabase(db, programData) {
  let program;
  db.write(() => {
    const program = db.create('program', {
      _id: shortid.generate(),
      name: 'Test program',
    });
    
    const surveys = programData.surveys.map(s => writeSurvey(db, program, s));

    program.surveys = surveys;
  });

  return program;
}

