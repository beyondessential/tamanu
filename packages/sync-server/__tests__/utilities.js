import supertest from 'supertest';
import Chance from 'chance';

import { createApp } from 'sync-server/app/createApp';
import { initDatabase } from 'sync-server/app/database';
import { getToken } from 'sync-server/app/middleware/auth';

const chance = new Chance();

const formatError = response => `

Error details:
${JSON.stringify(response.body.error, null, 2)}
`;

export function extendExpect(expect) {
  expect.extend({
    toBeForbidden(response) {
      const { statusCode } = response;
      const pass = statusCode === 403;
      if (pass) {
        return {
          message: () =>
            `Expected not forbidden (!== 403), got ${statusCode}. ${formatError(response)}`,
          pass,
        };
      }
      return {
        message: () => `Expected forbidden (403), got ${statusCode}. ${formatError(response)}`,
        pass,
      };
    },
    toHaveRequestError(response) {
      const { statusCode } = response;
      const pass = statusCode >= 400 && statusCode < 500 && statusCode !== 403;
      if (pass) {
        return {
          message: () =>
            `Expected no error status code, got ${statusCode}. ${formatError(response)}`,
          pass,
        };
      }
      return {
        message: () => `Expected error status code, got ${statusCode}. ${formatError(response)}`,
        pass,
      };
    },
    toHaveSucceeded(response) {
      const { statusCode } = response;
      const pass = statusCode < 400;
      if (pass) {
        return {
          message: () => `Expected failure status code, got ${statusCode}.`,
          pass,
        };
      }
      return {
        message: () => `Expected success status code, got ${statusCode}. ${formatError(response)}`,
        pass,
      };
    },
  });
}

export function createTestContext() {
  const { store } = initDatabase({
    testMode: true,
  });

  const expressApp = createApp({ store });

  const baseApp = supertest(expressApp);

  /*
  baseApp.asUser = async user => {
    const agent = supertest.agent(expressApp);
    const token = await getToken(user, '1d');
    agent.set('authorization', `Bearer ${token}`);
    agent.user = user;
    return agent;
  };
  */

  baseApp.asRole = async role => {
    const agent = supertest.agent(expressApp);
    const token = 'fake-token';
    agent.set('authorization', `Bearer ${token}`);
    return agent;

    /*
    const newUser = await models.User.create({
      email: chance.email(),
      displayName: chance.name(),
      password: chance.string(),
      role,
    });

    return baseApp.asUser(newUser);
    */
  };

  return { baseApp, store };
}
