import { Sequelize } from 'sequelize';
import config from 'config';

import * as models from 'Shared/models';

import { log } from '../logging';
import uuid from 'uuid';


// make a 'fake' uuid that looks like 'test-766-9794-4491-8612-eb19fd959bf2'
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'test-%'"
const createTestUUID = () => 'test-' + uuid().slice(5);
  
export function initDatabase({
  testMode = false
}) {
  // connect to database
  log.info(`Connecting to database ${config.db.username}@${config.db.name}...`);
  const sequelize = new Sequelize(
    config.db.name, 
    config.db.username,
    config.db.password,
    {
      dialect: 'sqlite',
      storage: 'data/test.db',
      logging: (s) => log.debug(s),
    }
  );

  // init all models
  const modelClasses = Object.entries(models);
  log.info(`Registering ${modelClasses.length} models...`);
  const createId = testMode
    ? createTestUUID
    : Sequelize.UUIDV4;
  modelClasses.map(([name, cls]) => {
    cls.init({
      underscored: true,
      createId,
      sequelize
    }, models);
  });

  modelClasses.map(([name, cls]) => {
    if(cls.initRelations) {
      cls.initRelations(models);
    }
  });

  return { sequelize, models };
}
