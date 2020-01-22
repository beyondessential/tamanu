import { createApp } from 'Lan/createApp';
import { initDatabase } from 'Lan/app/database';
import supertest from 'supertest';

import { getToken } from 'Lan/app/controllers/auth/middleware';

export function extendExpect(expect) {
  expect.extend({
    toHaveRequestError(response) {
      const { statusCode } = response;
      const pass = statusCode >= 400 && statusCode < 500;
      if (pass) {
        return {
          message: () => `expected no server error status code, got ${statusCode}.
          
Error details: 
${JSON.stringify(response.body.error, null, 2)}`,
          pass,
        };
      }
      return {
        message: () => `expected server error status code, got ${statusCode}`,
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
    return agent;
  };

  return testApp;
}

export function getTestContext() {
  return createContext();
}
