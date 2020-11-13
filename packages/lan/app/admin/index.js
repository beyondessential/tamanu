import { log } from '../logging';

import config from 'config';

async function importData({ file }) {
  log.info(`Importing ${file}`);

  // parse file to xlsx using the usual method
  
  // then restructure the parsed data to sync record format 
  
  // then send the records to sync server
  // - idempotent
}

const tasks = {
  importData,
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
