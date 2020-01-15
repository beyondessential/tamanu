import { createApp } from 'Lan/createApp';
import { initDatabase } from 'Lan/app/database';
import supertest from 'supertest';

export function extendExpect(expect) {
  expect.extend({
    toHaveRequestError(response) {
      const { statusCode } = response;
      const pass = statusCode >= 400 && statusCode < 500;
      if(pass) {
        return {
          message: () => `expected no server error status code, got ${statusCode}.
          
Error details: 
${JSON.stringify(response.body.error, null, 2)}`,
          pass
        };
      } else {
        return {
          message: () => `expected server error status code, got ${statusCode}`,
          pass
        };
      }
    },
  });
}

export function deleteAllTestIds({ models, sequelize }) {
  console.log("Deleting all test records from database...");
  const tableNames = Object.values(models).map(m => m.tableName);
  const deleteTasks = tableNames.map(x => sequelize.query(`
    DELETE FROM ${x} WHERE id LIKE 'test-%';
  `));
  return Promise.all(deleteTasks);
}

function createContext() {
  const dbResult = initDatabase({ 
    testMode: true 
  });

  const app = supertest(createApp(dbResult));
  app.sequelize = dbResult.sequelize;
  app.models = dbResult.models;

  return app;
}

let context = null;

export function getTestContext() {
  if(!context) {
    context = createContext();
  }
  return context;
}
