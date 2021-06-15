import { log } from 'shared/services/logging';
import { existsSync } from 'fs';
import { readFile, utils } from 'xlsx';
import config from 'config';

const yesOrNo = value => !!(value && value.toLowerCase() === 'yes');

const idify = name => name.toLowerCase().replace(/\W/g, '');

const makeRecord = (recordType, data) => ({
  recordType,
  data,
});

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

function makeScreen(questions, componentData) {
  return questions
    .map((component, i) => {
      const {
        visibilityCriteria = '',
        validationCriteria = '',
        detail = '',
        config = '',
        calculation = '',
        ...elementData
      } = component;

      const dataElement = makeRecord('programDataElement', {
        id: `pde-${elementData.code}`,
        defaultOptions: '',
        ...elementData,
      });

      const surveyScreenComponent = makeRecord('surveyScreenComponent', {
        id: `${componentData.surveyId}-${elementData.code}`,
        dataElementId: dataElement.data.id,
        text: '',
        options: '',
        componentIndex: i,
        visibilityCriteria,
        validationCriteria,
        detail,
        config,
        calculation,
        ...componentData,
      });

      return [dataElement, surveyScreenComponent];
    })
    .flat();
}

function importDataElement(row) {
  const { newScreen, options, optionLabels, text, ...rest } = row;

  return {
    newScreen: yesOrNo(newScreen),
    defaultOptions: options,
    optionLabels: newlinesToArray(optionLabels),
    defaultText: text,
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
    return questions.slice(start, end);
  });
}

function importSurveySheet(data, surveyId) {
  const questions = data.map(importDataElement).filter(q => q.code);
  const screens = splitIntoScreens(questions);

  return screens
    .map((x, i) => 
      makeScreen(x, {
        surveyId,
        screenIndex: i,
      }),
    )
    .flat();
}

export function importProgram({ file, whitelist }) {
  if (!existsSync(file)) {
    throw new Error(`File ${file} not found`);
  }

  log.info(`Reading surveys from ${file}...`);
  const workbook = readFile(file);
  const metadataSheet = workbook.Sheets.Metadata;

  if (!metadataSheet) {
    throw new Error("A program workbook must have a sheet named Metadata");
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

  // detect if we're importing to home server
  const { homeServer = "", country } = programMetadata;
  const { host } = config.sync;
  // ignore slashes when comparing servers - easiest way to account for trailing slashes that may or may not be present
  const importingToHome = !homeServer || homeServer.replace("/", "") === host.replace("/", "");
  const prefix = (!importingToHome && country) ? `(${country}) ` : "";
  
  if (!importingToHome) {
    if (!host.match(/(dev|demo|staging)/)) {
      throw new Error(`This workbook can only be imported to ${homeServer} or a non-production (dev/demo/staging) server. (nb: current server is ${host})`);
    }
  }

  // main container elements
  const programRecord = makeRecord('program', {
    id: `program-${idify(programMetadata.programCode)}`,
    name: `${prefix}${programMetadata.programName}`,
  });

  if (!headerRow) {
    throw new Error("A survey workbook Metadata sheet must have a row starting with a 'name' or 'code' cell");
  }

  // read metadata table starting at header row
  const surveyMetadata = utils.sheet_to_json(metadataSheet, { range: headerRow });

  const shouldImportSurvey = ({ status = "", name, code }) => {
    // check against whitelist
    if (whitelist && whitelist.length > 0) {
      if (!whitelist.some(x => x === name || x === code)) {
        return false;
      }
    }

    // check against home server & publication status
    switch (status) {
      case "publish":
        return true;
      case "hidden":
        return false;
      case "draft": 
      case "":
        return !importingToHome;
      default:
        throw new Error(`Survey ${name} has invalid status ${status}. Must be one of publish, draft, hidden.`);
    }
  };

  // then loop over each survey defined in metadata and import it
  const surveys = surveyMetadata
    .filter(shouldImportSurvey)
    .map(md => {
      const data = utils.sheet_to_json(workbook.Sheets[md.name]);
      
      if (!data) {
        throw new Error(`Sheet named ${md.name} was not found in the workbook`);
      }

      const surveyRecord = makeRecord('survey', {
        id: `${programRecord.data.id}-${idify(md.code)}`,
        name: `${prefix}${md.name}`,
        programId: programRecord.data.id,
        surveyType: md.surveyType,
      });

      const records = importSurveySheet(data, surveyRecord.data.id);

      return [
        surveyRecord,
        ...records,
      ];
    }).flat();

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

  return [
    programRecord,
    ...surveys.flat(),
  ];
}

