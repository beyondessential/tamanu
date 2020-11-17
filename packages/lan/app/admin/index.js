
import fetch from 'node-fetch';
import config from 'config';
import shortid from 'shortid';

import { log } from '../logging';
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
      id: `dataElement/${elementData.code}`,
      code: elementData.code,
      name: elementData.name,
      defaultOptions: '',
      ...elementData,
    });
    
    const surveyScreenComponent = makeRecord('surveyScreenComponent', {
      id: `${componentData.surveyId}/component-${elementData.code}`,
      dataElementId: dataElement.data.id, 
      componentIndex: i,
      ...componentData,
    });

    return [dataElement, surveyScreenComponent];
  })).flat();
}

const idify = name => name.toLowerCase().replace(/\W/g, '-');

async function importSurvey(taskDefinition) {
  const {
    file,
    programCode,
    programName,
    surveyCode,
    surveyName,
  } = taskDefinition;
  log.info(`Importing surveys from ${file}...`);

  const data = readSurveyXSLX(programName, file);

  const programElement = makeRecord('program', { 
    id: `program-${idify(programCode)}`,
    name: programName,
  });

  const surveyElement = makeRecord('survey', { 
    id: `${programElement.data.id}/survey-${idify(surveyCode)}`,
    name: surveyName,
    programId: programElement.data.id,
  });

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

  const body = records;

  const url = `${config.syncHost}/v1/sync/program-import-test`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': '1243',
    },
    body: JSON.stringify(body),
  });

  console.log(await response.json());
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
