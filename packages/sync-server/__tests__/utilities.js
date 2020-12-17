import supertest from 'supertest';
import Chance from 'chance';
import http from 'http';

import { createApp } from 'sync-server/app/createApp';
import { initDatabase } from 'sync-server/app/database';
import { QueryTypes } from 'sequelize';
import { getToken } from 'sync-server/app/middleware/auth';

const chance = new Chance();

const formatError = response => {
  if (!response.body) {
    return `

Error has no body! (Did you forget to await?)
`;
  }
  return `

Error details:
${JSON.stringify(response.body.error, null, 2)}
`;
};

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
    toHaveRequestError(response, expected) {
      const { statusCode } = response;
      const match = !expected || expected === statusCode;
      const pass = statusCode >= 400 && statusCode < 500 && statusCode !== 403 && match;
      let expectedText = 'Expected error status code';
      if (expected) {
        expectedText += ` ${expected}`;
      }
      if (pass) {
        return {
          message: () => `${expectedText}, got ${statusCode}.`,
          pass,
        };
      }
      return {
        message: () => `${expectedText}, got ${statusCode}. ${formatError(response)}`,
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
  const appServer = http.createServer(expressApp);
  const baseApp = supertest(appServer);

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

  const close = async () => {
    await new Promise(resolve => appServer.close(resolve));
  };

  return { baseApp, store, close };
}

export async function withDate(fakeDate, fn) {
  const OldDate = global.Date;
  try {
    global.Date = class extends OldDate {
      constructor(...args) {
        if (args.length > 0) {
          return new OldDate(...args);
        }
        return fakeDate;
      }

      static now() {
        return fakeDate.valueOf();
      }
    };
    await fn();
  } finally {
    global.Date = OldDate;
  }
}

// https://github.com/sequelize/sequelize/issues/3759#issuecomment-524036513
// THIS IS NOT SAFE! It interpolates a table name directly. Do not use it outside tests.
export async function unsafeSetUpdatedAt(store, { table, ...replacements }) {
  return store.sequelize.query(`UPDATE ${table} SET updated_at = :updated_at WHERE id = :id`, {
    type: QueryTypes.UPDATE,
    replacements,
  });
}
