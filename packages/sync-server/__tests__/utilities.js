import supertest from 'supertest';
import Chance from 'chance';
import http from 'http';

import { COMMUNICATION_STATUSES } from 'shared/constants';

import { createApp } from 'sync-server/app/createApp';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import { getToken } from 'sync-server/app/auth/utils';
import { initIntegrations } from 'sync-server/app/integrations';

jest.setTimeout(30 * 1000); // more generous than the default 5s but not crazy
jest.mock('../app/utils/getFreeDiskSpace');

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
      const match = expected === statusCode;
      const pass = statusCode >= 400 && statusCode !== 403 && (statusCode < 500 || match);
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

class MockApplicationContext {
  closeHooks = [];

  async init() {
    this.store = await initDatabase({ testMode: true });
    this.emailService = {
      sendEmail: jest.fn().mockImplementation(() =>
        Promise.resolve({
          status: COMMUNICATION_STATUSES.SENT,
          result: { '//': 'mailgun result not mocked' },
        }),
      ),
    };
    await initIntegrations(this);
    return this;
  }

  onClose(hook) {
    this.closeHooks.push(hook);
  }

  async close() {
    await Promise.all(this.closeHooks.map(async hook => hook()));
    await closeDatabase();
  }
}

export async function createTestContext() {
  const ctx = await new MockApplicationContext().init();
  const expressApp = createApp(ctx);
  const appServer = http.createServer(expressApp);
  ctx.onClose(() => new Promise(resolve => appServer.close(resolve)));
  const baseApp = supertest(appServer);

  baseApp.asUser = async user => {
    const agent = supertest.agent(expressApp);
    const token = await getToken(user, '1d');
    agent.set('authorization', `Bearer ${token}`);
    agent.user = user;
    return agent;
  };

  baseApp.asRole = async role => {
    const newUser = await ctx.store.models.User.create({
      email: chance.email(),
      displayName: chance.name(),
      password: chance.string(),
      role,
    });

    return baseApp.asUser(newUser);
  };

  ctx.baseApp = baseApp;

  return ctx;
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
