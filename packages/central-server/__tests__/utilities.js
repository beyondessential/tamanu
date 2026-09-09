import { vi } from 'vitest';
import config from 'config';
import supertest from 'supertest';

import {
  COMMUNICATION_STATUSES,
  JWT_TOKEN_TYPES,
  REPORT_DB_CONNECTION_VALUES,
  SERVER_TYPES,
} from '@tamanu/constants';
import { seedSettings } from '@tamanu/database/demoData';
import { ReadSettings } from '@tamanu/settings';
import { fake } from '@tamanu/fake-data/fake';
import { asNewRole } from '@tamanu/fake-data/test-helpers';
import { sleepAsync } from '@tamanu/utils/sleepAsync';
import { setFhirRefreshTriggers } from '@tamanu/database';
import { initFhirSettingsFromDb, resetFhirSettings } from '@tamanu/shared/utils/fhir/fhirSettings';

import { buildToken } from '../app/auth/utils';
import { createApp } from '../app/createApp';
import { closeDatabase, initDatabase } from '../app/database';
import { initIntegrations } from '../app/integrations';

class MockApplicationContext {
  closeHooks = [];

  async init({ initFhir = false, initFhirTriggers = false } = {}) {
    this.store = await initDatabase({ testMode: true });
    // Report SQL runs on the main test connection rather than dedicated reporting
    // roles, but the stores have to be present or write routes refuse to run.
    this.reportSchemaStores = Object.fromEntries(
      REPORT_DB_CONNECTION_VALUES.map(connection => [connection, this.store]),
    );
    this.settings = new ReadSettings(this.store.models);
    await seedSettings(this.store.models);
    // Mirrors startScheduledTasks, so tests can construct tasks directly
    this.schedules = await this.settings.get('schedules');
    this.integrationSettings = await this.settings.get('integrations');
    if (initFhir) {
      resetFhirSettings();
      await initFhirSettingsFromDb(this.settings);
    }
    if (initFhirTriggers) {
      await setFhirRefreshTriggers(this.store.sequelize, { fhirWorkerEnabled: true });
    }

    this.emailService = {
      sendEmail: vi.fn().mockImplementation(() =>
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

export async function createTestContext({
  initFhir = false,
  initFhirTriggers = false,
  aiService,
} = {}) {
  const ctx = await new MockApplicationContext().init({ initFhir, initFhirTriggers });
  if (aiService) ctx.aiService = aiService;
  const { models } = ctx.store;
  const { express: expressApp, server: appServer } = await createApp(ctx);
  const baseApp = supertest.agent(appServer);
  baseApp.set('X-Tamanu-Client', SERVER_TYPES.WEBAPP);

  baseApp.asUser = async user => {
    const agent = supertest.agent(expressApp);
    agent.set('X-Tamanu-Client', SERVER_TYPES.WEBAPP);
    const token = await buildToken({ userId: user.id }, null, {
      expiresIn: '1d',
      audience: JWT_TOKEN_TYPES.ACCESS,
      issuer: config.canonicalHostName,
    });
    agent.set('authorization', `Bearer ${token}`);
    agent.user = user;
    return agent;
  };

  baseApp.asRole = async role => {
    const newUser = await models.User.create(fake(models.User, { role }));

    return baseApp.asUser(newUser);
  };

  baseApp.asNewRole = async (permissions = [], roleOverrides = {}) => {
    return asNewRole(baseApp, models, permissions, roleOverrides);
  };

  ctx.onClose(
    () =>
      new Promise(resolve => {
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

export const waitForSession = async (centralSyncManager, sessionId) => {
  let ready = false;
  while (!ready) {
    ready = await centralSyncManager.checkSessionReady(sessionId);
    await sleepAsync(100);
  }
};

export const waitForPushCompleted = async (centralSyncManager, sessionId) => {
  let complete = false;
  while (!complete) {
    complete = await centralSyncManager.checkPushComplete(sessionId);
    await sleepAsync(100);
  }
};

const DEFAULT_CONFIG = {
  sync: {
    lookupTable: {
      enabled: false,
    },
    maxRecordsPerSnapshotChunk: 1000000000,
  },
};

export const initializeCentralSyncManagerWithContext = async (ctx, config) => {
  // Imported here rather than at the top of the file so that a test case's vi.doMock of a
  // dependency is in place before the module graph under test is evaluated.
  const { CentralSyncManager: TestCentralSyncManager } = await import(
    '../app/sync/CentralSyncManager'
  );

  TestCentralSyncManager.overrideConfig(config || DEFAULT_CONFIG);

  return new TestCentralSyncManager(ctx);
};
