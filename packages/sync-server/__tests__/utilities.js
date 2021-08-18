import supertest from 'supertest';
import Chance from 'chance';
import http from 'http';

import { COMMUNICATION_STATUSES } from 'shared/constants';

import { createApp } from 'sync-server/app/createApp';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import { getToken } from 'sync-server/app/auth/utils';

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

export async function createTestContext() {
  const { store } = await initDatabase({ testMode: true });
  const emailService = {
    sendEmail: jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: COMMUNICATION_STATUSES.SENT,
        result: { '//': 'mailgun result not mocked' },
      }),
    ),
  };

  const expressApp = createApp({ store, emailService });
  const appServer = http.createServer(expressApp);
  const baseApp = supertest(appServer);

  baseApp.asUser = async user => {
    const agent = supertest.agent(expressApp);
    const token = await getToken(user, '1d');
    agent.set('authorization', `Bearer ${token}`);
    agent.user = user;
    return agent;
  };

  baseApp.asRole = async role => {
    const newUser = await store.models.User.create({
      email: chance.email(),
      displayName: chance.name(),
      password: chance.string(),
      role,
    });

    return baseApp.asUser(newUser);
  };

  const close = async () => {
    await new Promise(resolve => appServer.close(resolve));
    await closeDatabase();
  };

  return { baseApp, store, close, emailService };
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
