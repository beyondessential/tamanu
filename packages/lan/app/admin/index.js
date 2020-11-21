
import config from 'config';

import { log } from '../logging';

import { importSurvey } from './importProgram';

import { readDataDefinition } from '~/dataDefinitionImporter';

/***********
 * Update your local.json to something like this to import data files
 
{
  "adminTasks": [
    { 
      "task": "importData",
      "file": "./data/demo_definitions.xlsx" 
    },
    { 
      "task": "importSurvey", 
      "file": "./data/demo_survey_pen_assessment.xlsx",
      "programName": "NCD",
      "programCode": "NCD-Samoa",
      "surveyName": "NCD Assessment",
      "surveyCode": "NCD-Assessment"
    }
  ]
}
 **********/

async function importData({ file }) {
  log.info(`Importing data definitions from ${file}...`);

  const data = await readDataDefinition(file);

  console.log(data);
  
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

  log.info(`==== Running task: ${taskName}`);

  await task(params);

  log.info(`Done.`);
}

export async function runAdminTasks(tasks) {
  log.info("Running admin tasks...");

  for(const t of tasks) {
    if(typeof t === "string") {
      await runTask({ name: t });
    } else {
      await runTask(t);
    }
  }

  log.info("All admin tasks finished.");
}
