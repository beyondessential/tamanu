import config from 'config';
import { initDatabase } from './app/database';
import { log } from './app/logging';

import { createApp } from './app/createApp';

import { startScheduledTasks } from './app/tasks';
import { startDataChangePublisher } from './app/DataChangePublisher';

import { importDataDefinition } from './app/dataDefinitionImporter';
import {
  readSurveyXSLX,
  writeProgramToDatabase,
  writeSurveyToDatabase,
} from './app/surveyImporter';

const port = config.port;

async function importDemoPrograms(models) {
  const definitions = [
    {
      programName: 'Covid-19',
      surveyName: 'Covid-19 risk assessment',
      path: './data/demo_survey.xlsx',
    },
    {
      programName: 'NCE PEN Assessment',
      surveyName: 'NCE Risk assessment survey',
      path: './data/demo_survey_pen_assessment.xlsx',
    },
  ];

  for (const definition of definitions) {
    const { programName, surveyName, path } = definition;

    log.info(`Importing test survey ${programName}/${surveyName} from ${path}...`);
    const program = await writeProgramToDatabase(models, {
      code: programName.toUpperCase().replace(/\W+/g, ''),
      name: programName,
    });
    const data = await readSurveyXSLX(surveyName, path);
    await writeSurveyToDatabase(models, program, data);
    log.info('Surveys imported.');
  }
}

async function performInitialSetup({ sequelize, models }) {
  // sync models with database
  // (TODO: proper migrations)
  await sequelize.sync();

  const existingUser = await models.User.findOne();
  if (existingUser) {
    // database has been populated
    return;
  }

  // run initial import
  const path = config.initialDataPath;
  log.info(`Importing initial data from ${path}...`);
  await importDataDefinition(models, path, sheetResult => {
    const { sheetName, created, updated, errors } = sheetResult;
    log.info(`Importing ${sheetName}: ${created} created, ${updated} updated.`);
    errors.map(message => {
      log.warn(`- ${message}`);
    });
  });
  log.info(`Data import completed.`);

  await importDemoPrograms(models);
}

export async function run() {
  const context = initDatabase({
    testMode: false,
  });

  await performInitialSetup(context);

  const app = createApp(context);
  const server = app.listen(port, () => {
    log.info(`Server is running on port ${port}!`);
  });

  startScheduledTasks(context);

  startDataChangePublisher(server, context);

  // TODO: sync with remote server
}

run();
