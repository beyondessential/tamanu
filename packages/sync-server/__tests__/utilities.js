import config from 'config';
import supertest from 'supertest';
import Chance from 'chance';
import http from 'http';

import { COMMUNICATION_STATUSES, JWT_TOKEN_TYPES } from '@tamanu/shared/constants';
import { createApp } from 'sync-server/app/createApp';
import { initDatabase, closeDatabase } from 'sync-server/app/database';
import { getToken } from 'sync-server/app/auth/utils';
import { DEFAULT_JWT_SECRET } from 'sync-server/app/auth';
import { initIntegrations } from 'sync-server/app/integrations';
import { configurationNoteTypeIds } from '@tamanu/shared/demoData';

const chance = new Chance();

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
    await ctx.store.models.UserLocalisationCache.create({
      userId: user.id,
      localisation: JSON.stringify({
        data: { noteTypeIds: configurationNoteTypeIds },
      }),
    });
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
