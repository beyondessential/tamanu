import config from 'config';
import supertest from 'supertest';
import Chance from 'chance';
import http from 'http';
import 'jest-expect-message';
import * as jestExtendedMatchers from 'jest-extended';

import { COMMUNICATION_STATUSES } from 'shared/constants';
import { createApp } from 'sync-server/app/createApp';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import { getToken } from 'sync-server/app/auth/utils';
import { DEFAULT_JWT_SECRET } from 'sync-server/app/auth';
import { initIntegrations } from 'sync-server/app/integrations';
import { JWT_TOKEN_TYPES } from 'shared/constants/auth';

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
  // Needs to be added explicitly because of the jest-expect-message import
  expect.extend(jestExtendedMatchers);
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

  close = async () => {
    for (const hook of this.closeHooks) {
      await hook();
    }
    await closeDatabase();
  };
}

export async function createTestContext() {
  const ctx = await new MockApplicationContext().init();
  const expressApp = createApp(ctx);
  const appServer = http.createServer(expressApp);
  const baseApp = supertest.agent(appServer);
  baseApp.set('X-Tamanu-Client', 'Tamanu Desktop');

  baseApp.asUser = async user => {
    const agent = supertest.agent(expressApp);
    agent.set('X-Tamanu-Client', 'Tamanu Desktop');
    const token = await getToken({ userId: user.id }, DEFAULT_JWT_SECRET, {
      expiresIn: '1d',
      audience: JWT_TOKEN_TYPES.ACCESS,
      issuer: config.canonicalHostName,
    });
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

  ctx.onClose(() => new Promise(resolve => appServer.close(resolve)));
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
    return await fn();
  } finally {
    global.Date = OldDate;
  }
}
