import { createApp } from 'Lan/createApp';
import { initDatabase } from 'Lan/app/database';
import supertest from 'supertest';
import Chance from 'chance';

import { getToken } from 'Lan/app/controllers/auth/middleware';

const chance = new Chance();

export function extendExpect(expect) {
  expect.extend({
    toHaveRequestError(response) {
      const { statusCode } = response;
      const pass = statusCode >= 400;
      if (pass) {
        return {
          message: () => `Expected no error status code, got ${statusCode}.
          
Error details: 
${JSON.stringify(response.body.error, null, 2)}`,
          pass,
        };
      }
      return {
        message: () => `Expected error status code, got ${statusCode}`,
        pass,
      };
    },
  });
}

export function deleteAllTestIds({ models, sequelize }) {
  console.log('Deleting all test records from database...');
  const tableNames = Object.values(models).map(m => m.tableName);
  const deleteTasks = tableNames.map(x =>
    sequelize.query(`
    DELETE FROM ${x} WHERE id LIKE 'test-%';
  `),
  );
  return Promise.all(deleteTasks);
}

function createContext() {
  const dbResult = initDatabase({
    testMode: true,
  });

  const app = createApp(dbResult);

  const testApp = supertest(app);
  testApp.sequelize = dbResult.sequelize;
  testApp.models = dbResult.models;

  testApp.asUser = async user => {
    const agent = supertest.agent(app);
    const token = await getToken(user, '1d');
    agent.set('authorization', `Bearer ${token}`);
    agent.user = user;
    agent.sequelize = testApp.sequelize;
    agent.models = testApp.models;
    return agent;
  };

  testApp.withPermissions = async permissions => {
    const newUser = await testApp.models.User.create({
      email: chance.email(),
      displayName: chance.name(),
      password: chance.string(),
    });

    return await testApp.asUser(newUser);
  };

  return testApp;
}

export function getTestContext() {
  return createContext();
}
