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
    defaultOptions: options,
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

function importSurveySheet(data) {
  const dataElements = data.map(importDataElement).filter(q => q.code);

  const survey = {
    screens: splitIntoScreens(dataElements),
  };

  return survey;
}

export function readSurveyXSLX(surveyName, path) {
  const workbook = readFile(path);
  const metadataSheet = workbook.Sheets.Metadata;

  if (!metadataSheet) {
    throw new Error("A survey workbook must have a sheet named Metadata");
  }

  const programMetadata = {};
  
  // find the header row
  const headerRow = (() => {
    for (let i = 0; i < 10; ++i) {
      let cell = metadataSheet[`A${i+1}`];
      if (!cell) continue;
      if (cell.v == 'code' || cell.v == 'name') {
        // we've hit the header row -- immediately return
        return i;
      }
      let nextCell = metadataSheet[`B${i+1}`];
      if (!nextCell) continue;
      programMetadata[cell.v.trim()] = nextCell.v.trim();
    }

    // we've exhausted the search
    return undefined;
  })();

  if (!headerRow) {
    throw new Error("A survey workbook Metadata sheet must have a row starting with a 'name' or 'code' cell");
  }

  // read metadata table starting at header row
  const surveyMetadata = utils.sheet_to_json(metadataSheet, { range: headerRow });

  const shouldSkipSurvey = (md) => {
    return false;
  };

  // then loop over each survey defined in metadata and import it
  const surveys = surveyMetadata
    .filter(md => !shouldSkipSurvey(md.name))
    .map(md => {
      const data = utils.sheet_to_json(workbook.Sheets[md.name]);
      
      if (!data) {
        throw new Error(`Sheet named ${md.name} was not found in the workbook`);
      }

      return {
        ...md,
        ...importSurveySheet(data)
      };
    });

  // let's also warn the user about ignored sheets
  const ignoredSheetNames = Object.keys(workbook.Sheets).filter(name => {
    if (name === "Metadata") {
      return false;
    } else if (surveyMetadata.some(md => md.name === name)) {
      return false;
    } else {
      return true;
    }
  });

  console.log(programMetadata, surveys);

  return { 
    program: programMetadata,
    surveys,
    ignoredSheetNames,
  };
}

