import { log } from '../logging';

import config from 'config';
import shortid from 'shortid';

import { readSurveyXSLX } from '../surveyImporter';

/***********
 * Update your local.json to something like this to import data files
 
{
  "adminTasks": [
    { "task": "importData", "file": "./data/demo_definitions.xlsx" },
    { "task": "importData", "file": "./data/demo_survey_pen_assessment.xlsx" }
  ]
}
 **********/

const makeRecord = (recordType, data) => ({
  recordType,
  data: {
    id: shortid(),
    ...data,
  }
});

function makeScreen(screen, componentData) {
  return screen.dataElements.map(((component, i) => {
    const {
      visibilityCriteria,
      ...elementData
    } = component;

    const dataElement = makeRecord('programDataElement', {
      defaultOptions: '',
      ...elementData,
    });

    const surveyScreenComponent = makeRecord('surveyScreenComponent', {
      dataElementId: dataElement.data.id, 
      componentIndex: i,
      ...componentData,
    });

    return [dataElement, surveyScreenComponent];
  })).flat();
}

async function importSurvey({ file }) {
  log.info(`Importing surveys from ${file}...`);

  const data = readSurveyXSLX("Test", file);

  const programElement = makeRecord('program', { name: data.name });
  const surveyElement = makeRecord('survey', { programId: programElement.data.id });

  // component elements
  const screenElements = data.screens.map((x, i) => makeScreen(x, {
    surveyId: surveyElement.data.id,
    screenIndex: i,
  })).flat();

  // data elements
  
  const records = [
    programElement,
    surveyElement,
    ...screenElements,
  ];

  console.log(records);
}

async function importData({ file }) {
  log.info(`Importing data definitions from ${file}...`);

  // parse file to xlsx using the usual method
  
  // then restructure the parsed data to sync record format 
  
  // then send the records to sync server
  // - idempotent?
}

const tasks = {
  importData,
  importSurvey,
};

async function runTask(definition) {
  const { task: taskName, ...params } = definition;

  const task = tasks[taskName];
  if(!task) {
    log.warn(`No such task: ${taskName}`);
    return;
  } 

  log.info(`Running task: ${taskName}`);

  task(params);

  log.info(`Done.`);
}

export function runAdminTasks(tasks) {
  log.info("Running admin tasks...");

  for(const t of tasks) {
    if(typeof t === "string") {
      runTask({ name: t });
    } else {
      runTask(t);
    }
  }

  log.info("All admin tasks finished.");
}
