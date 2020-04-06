import { readFile, utils } from 'xlsx';

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
      return questions.slice(start, end);
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

function importXLSX(path) {
  const workbook = readFile(path);
  const sheets = Object.entries(workbook.Sheets);
  const surveys = sheets.map(([name, data]) => importSheet(name, data));
  return { 
    surveys
  };
}

function runAsScript() {
  const filename = process.argv.find(x => x.endsWith('xlsx'));
  if(filename) {
    const program = importXLSX(filename);
    console.log(program.surveys[0].screens);
  }
}

runAsScript();
