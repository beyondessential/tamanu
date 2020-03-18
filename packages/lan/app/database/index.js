import { Sequelize } from 'sequelize';
import config from 'config';
import { createNamespace } from 'cls-hooked';

import * as models from 'shared/models';

import uuid from 'uuid';
import { log } from '../logging';

// make a 'fake' uuid that looks like 'test-766-9794-4491-8612-eb19fd959bf2'
// this way we can run tests against real data and clear out everything that was
// created by the tests with just "DELETE FROM table WHERE id LIKE 'test-%'"
const createTestUUID = () => `test-${uuid().slice(5)}`;

export function initDatabase({ testMode = false }) {
  // connect to database
  log.info(`Connecting to database ${config.db.username}@${config.db.name}...`);

  const namespace = createNamespace('sequelize-transaction-namespace');
  Sequelize.useCLS(namespace);
  const sequelize = new Sequelize(config.db.name, config.db.username, config.db.password, {
    dialect: 'sqlite',
    storage: '/tmp/tamanu-test.db',
    logging: s => log.debug(s),
  });

  // init all models
  const modelClasses = Object.values(models);
  const primaryKey = {
    type: Sequelize.UUID,
    defaultValue: testMode ? createTestUUID : Sequelize.UUIDV4,
    primaryKey: true,
  };
  log.info(`Registering ${modelClasses.length} models...`);
  modelClasses.map(modelClass => {
    modelClass.init(
      {
        underscored: true,
        primaryKey,
        sequelize,
      },
      models,
    );
  });

  modelClasses.map(modelClass => {
    if (modelClass.initRelations) {
      modelClass.initRelations(models);
    }
  });

  return { sequelize, models };
}
