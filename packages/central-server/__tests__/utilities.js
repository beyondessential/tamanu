import config from 'config';
import supertest from 'supertest';

import { COMMUNICATION_STATUSES, JWT_TOKEN_TYPES, SERVER_TYPES } from '@tamanu/constants';
import { createMockReportingSchemaAndRoles } from '@tamanu/database/demoData';
import { ReadSettings } from '@tamanu/settings';
import { fake, asNewRole } from '@tamanu/shared/test-helpers';
import { DEFAULT_JWT_SECRET } from '../dist/auth';
import { buildToken } from '../dist/auth/utils';
import { createApp } from '../dist/createApp';
import { closeDatabase, initDatabase, initReporting } from '../dist/database';
import { initIntegrations } from '../dist/integrations';

class MockApplicationContext {
  closeHooks = [];

  async init() {
    this.store = await initDatabase({ testMode: true });
    this.settings = new ReadSettings(this.store.models);

    if (config.db.reportSchemas?.enabled) {
      await createMockReportingSchemaAndRoles({ sequelize: this.store.sequelize });
      this.reportSchemaStores = await initReporting();
    }
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
  const { models } = ctx.store;
  const { express: expressApp, server: appServer } = await createApp(ctx);
  const baseApp = supertest.agent(appServer);
  baseApp.set('X-Tamanu-Client', SERVER_TYPES.WEBAPP);

  baseApp.asUser = async (user) => {
    const agent = supertest.agent(expressApp);
    agent.set('X-Tamanu-Client', SERVER_TYPES.WEBAPP);
    const token = await buildToken({ userId: user.id }, DEFAULT_JWT_SECRET, {
      expiresIn: '1d',
      audience: JWT_TOKEN_TYPES.ACCESS,
      issuer: config.canonicalHostName,
    });
    agent.set('authorization', `Bearer ${token}`);
    agent.user = user;
    return agent;
  };

  baseApp.asRole = async (role) => {
    const newUser = await models.User.create(fake(models.User, { role }));

    return baseApp.asUser(newUser);
  };

  baseApp.asNewRole = async (permissions = [], roleOverrides = {}) => {
    return asNewRole(baseApp, models, permissions, roleOverrides);
  };

  ctx.onClose(
    () =>
      new Promise((resolve) => {
        appServer.close(resolve);
      }),
  );
  ctx.baseApp = baseApp;

  return ctx;
}

/* eslint-disable no-constructor-return,require-atomic-updates */
// This helper is a race condition waiting to happen, but it's hard to avoid in
// cases where we need control over the date without changing all instances of
// Date.now() and new Date in the codebase and dependencies, or wrapping the
// test runner to override the system clock. Use sparingly.
export async function withDateUnsafelyFaked(fakeDate, fn) {
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
/* eslint-enable no-constructor-return,require-atomic-updates */
