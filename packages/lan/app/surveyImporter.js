import { readFile, utils } from 'xlsx';

const yesOrNo = value => !!(value && value.toLowerCase() === 'yes');

function newlinesToArray(data) {
  if (!data) return null;

  let split = ',';
  if (data.trim().match(/[\r\n]/)) {
    // multiline record - split on newlines instead
    split = /[\r\n]+/g;
  }

  const array = data
    .split(split)
    .map(x => x.trim())
    .filter(x => x);
  return JSON.stringify(array);
}

function importDataElement(row) {
  // Extract dataElement details from spreadsheet row
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

  const { newScreen, options, optionLabels, text, ...rest } = row;

  return {
    newScreen: yesOrNo(newScreen),
    defaultOptions: newlinesToArray(options),
    optionLabels: newlinesToArray(optionLabels),
    defaultText: text,
    ...rest,
  };
}

function splitIntoScreens(dataElements) {
  const screenStarts = dataElements
    .map((q, i) => ({ newScreen: q.newScreen, i }))
    .filter(q => q.i === 0 || q.newScreen)
    .concat([{ i: dataElements.length }]);

  return screenStarts.slice(0, -1).map((q, i) => {
    const start = q.i;
    const end = screenStarts[i + 1].i;
    return {
      dataElements: dataElements.slice(start, end),
    };
  });
}

function importSheet(sheet) {
  const data = utils.sheet_to_json(sheet);
  const dataElements = data.map(importDataElement).filter(q => q.code);

  const survey = {
    screens: splitIntoScreens(dataElements),
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

async function writeDataElement({ ProgramDataElement }, survey, dataElementData) {
  return ProgramDataElement.create({
    defaultOptions: '',
    ...dataElementData,
  });
}

async function writeScreen(models, survey, { screenIndex, dataElements }) {
  const componentTasks = dataElements.map(async (q, i) => {
    const dataElement = await writeDataElement(models, survey, q);
    const component = await models.SurveyScreenComponent.create({
      surveyId: survey.id,
      dataElementId: dataElement.id,
      screenIndex,
      componentIndex: i,
      visibilityCriteria: q.visibilityCriteria,
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

  const screenTasks = screens.map((s, i) =>
    writeScreen(models, survey, {
      screenIndex: i,
      ...s,
    }),
  );

  await Promise.all(screenTasks);

  return survey;
}

export async function writeProgramToDatabase(models, programData) {
  const program = await models.Program.create(programData);

  return program;
}
