import { log } from 'shared/services/logging';
import { existsSync } from 'fs';
import { readFile, utils } from 'xlsx';
import config from 'config';

const yesOrNo = value => !!(value && value.toLowerCase() === 'yes');

const idify = name => name.toLowerCase().replace(/\W/g, '');

const makeRecord = (recordType, data, sheet, row) => ({
  recordType,
  data,
  sheet,
  row,
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
        config: qConfig = '',
        calculation = '',
        row,
        ...elementData
      } = component;

      const { surveyId, sheet, ...otherComponentData } = componentData;

      const dataElement = makeRecord(
        'programDataElement',
        {
          id: `pde-${elementData.code}`,
          defaultOptions: '',
          ...elementData,
        },
        sheet,
        row,
      );

      const surveyScreenComponent = makeRecord(
        'surveyScreenComponent',
        {
          id: `${surveyId}-${elementData.code}`,
          dataElementId: dataElement.data.id,
          surveyId,
          text: '',
          options: '',
          componentIndex: i,
          visibilityCriteria,
          validationCriteria,
          detail,
          config: qConfig,
          calculation,
          ...otherComponentData,
        },
        sheet,
        row,
      );

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
    row: row.__rowNum__ + 1,
    ...rest,
  };
}

// Break an array of questions into chunks, with the split points determined
// by a newScreen: true property. (with newScreen: true questions placed as
// the first element of each chunk)
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

function importSurveySheet(data, survey) {
  const questions = data.map(importDataElement).filter(q => q.code);
  const screens = splitIntoScreens(questions);

  return screens
    .map((x, i) =>
      makeScreen(x, {
        surveyId: survey.id,
        sheet: survey.name,
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
    throw new Error('A program workbook must have a sheet named Metadata');
  }

  // The Metadata sheet follows this structure:
  // first few rows: program metadata (key in column A, value in column B)
  // then: survey metadata header row (with name & code in columns A/B, then other keys)
  // then: survey metadata values (corresponding to keys in the header row)

  const programMetadata = {};

  // Read rows as program metadata until we hit the survey header row
  // (this should be within the first few rows, there aren't many program metadata keys and
  // there's no reason to add blank rows here)
  const headerRow = (() => {
    const rowsToSearch = 10; // there are only a handful of metadata keys, so give up pretty early
    for (let i = 0; i < rowsToSearch; ++i) {
      const cell = metadataSheet[`A${i + 1}`];
      if (!cell) continue;
      if (cell.v === 'code' || cell.v === 'name') {
        // we've hit the header row -- immediately return
        return i;
      }
      const nextCell = metadataSheet[`B${i + 1}`];
      if (!nextCell) continue;
      programMetadata[cell.v.trim()] = nextCell.v.trim();
    }

    // we've exhausted the search
    throw new Error(
      "A survey workbook Metadata sheet must have a row starting with a 'name' or 'code' cell",
    );
  })();

  // detect if we're importing to home server
  const { homeServer = '', country } = programMetadata;
  const { host } = config.sync;

  // ignore slashes when comparing servers - easiest way to account for trailing slashes that may or may not be present
  const importingToHome = !homeServer || homeServer.replace('/', '') === host.replace('/', '');

  if (!importingToHome) {
    if (!host.match(/(dev|demo|staging)/)) {
      throw new Error(
        `This workbook can only be imported to ${homeServer} or a non-production (dev/demo/staging) server. (nb: current server is ${host})`,
      );
    }
  }

  if (!programMetadata.programCode) {
    throw new Error('A program must have a code');
  }

  if (!programMetadata.programName) {
    throw new Error('A program must have a name');
  }

  // Use a country prefix (eg "(Samoa)" if we're importing to a server other
  // than the home server.
  const prefix = !importingToHome && country ? `(${country}) ` : '';

  // main container elements
  const programRecord = makeRecord(
    'program',
    {
      id: `program-${idify(programMetadata.programCode)}`,
      name: `${prefix}${programMetadata.programName}`,
    },
    'Document',
    0,
  );

  // read metadata table starting at header row
  const surveyMetadata = utils.sheet_to_json(metadataSheet, { range: headerRow });

  const shouldImportSurvey = ({ status = '', name, code }) => {
    // check against whitelist
    if (whitelist && whitelist.length > 0) {
      if (!whitelist.some(x => x === name || x === code)) {
        return false;
      }
    }

    // check against home server & publication status
    switch (status) {
      case 'publish':
        return true;
      case 'hidden':
        return false;
      case 'draft':
      case '':
        return !importingToHome;
      default:
        throw new Error(
          `Survey ${name} has invalid status ${status}. Must be one of publish, draft, hidden.`,
        );
    }
  };

  // then loop over each survey defined in metadata and import it
  const surveys = surveyMetadata
    .filter(shouldImportSurvey)
    .map(md => {
      const surveyRecord = makeRecord(
        'survey',
        {
          id: `${programRecord.data.id}-${idify(md.code)}`,
          name: `${prefix}${md.name}`,
          programId: programRecord.data.id,
          surveyType: md.surveyType,
          isSensitive: md.isSensitive,
        },
        'Metadata',
        md.__rownum__ + 1,
      );

      // don't import questions for obsoleted surveys
      // (or even read their worksheet, or check if it exists)
      if (md.surveyType === 'obsolete') {
        return [surveyRecord];
      }

      // Strip some characters from workbook names before trying to find them
      // (this mirrors the punctuation stripping that node-xlsx does internally)
      const worksheet = workbook.Sheets[md.name.replace(/['"]/g, '')] || workbook.Sheets[md.code];
      if (!worksheet && md.surveyType !== 'obsolete') {
        const keys = Object.keys(workbook.Sheets);
        throw new Error(`Sheet named "${md.name}" was not found in the workbook. (found: ${keys})`);
      }
      const data = utils.sheet_to_json(worksheet);

      const records = importSurveySheet(data, surveyRecord.data);

      return [surveyRecord, ...records];
    })
    .flat();

  return [programRecord, ...surveys.flat()];
}
