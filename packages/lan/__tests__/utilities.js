import 'jest-expect-message';
import supertest from 'supertest';
import config from 'config';
import http from 'http';

import {
  seedDepartments,
  seedFacilities,
  seedLocations,
  seedLocationGroups,
  seedLabTests,
} from 'shared/demoData';
import { chance, fake, showError } from 'shared/test-helpers';

import { createApp } from 'lan/app/createApp';
import { initDatabase, closeDatabase, initReporting } from 'lan/app/database';
import { getToken } from 'lan/app/middleware/auth';

import { toMatchTabularReport } from './toMatchTabularReport';
import { allSeeds } from './seed';
import { deleteAllTestIds } from './setupUtilities';

import { FacilitySyncManager } from '../app/sync/FacilitySyncManager';
import { CentralServerConnection } from '../app/sync/CentralServerConnection';

jest.mock('../app/sync/CentralServerConnection');
jest.mock('../app/utils/uploadAttachment');

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
    toHaveStatus(response, status) {
      const { statusCode } = response;
      const pass = statusCode === status;
      if (pass) {
        return {
          message: () => `Expected status code ${status}, got ${statusCode}.`,
          pass,
        };
      }
      return {
        message: () =>
          `Expected status code ${status}, got ${statusCode}. ${formatError(response)}`,
        pass,
      };
    },
    toMatchTabularReport(receivedReport, expectedData, options) {
      return toMatchTabularReport(this, receivedReport, expectedData, options);
    },
  });
}

export async function prepareMockReportingSchema({ sequelize }) {
  const { raw, reporting } = config.db.reports.credentials;
  await sequelize.transaction(async () => {
    try {
      await sequelize.query(`
      CREATE SCHEMA IF NOT EXISTS reporting;
      -- create roles if they don't exist this can happen on local dev when running tests
      DO $$
      BEGIN
      CREATE ROLE ${reporting.username} WITH
        LOGIN 
        PASSWORD '${reporting.password}';
      CREATE ROLE ${raw.username} WITH
        LOGIN 
        PASSWORD '${raw.password}';
      EXCEPTION WHEN duplicate_object THEN RAISE NOTICE '%, skipping', SQLERRM USING ERRCODE = SQLSTATE;
      END
      $$;
      ALTER ROLE ${reporting.username} SET search_path TO reporting;
      GRANT USAGE ON SCHEMA reporting TO ${reporting.username};
      GRANT USAGE ON SCHEMA public TO ${raw.username};
      GRANT SELECT ON ALL TABLES IN SCHEMA reporting TO ${reporting.username};
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO ${raw.username};
    `);
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
}

export async function createTestContext(options = {}) {
  let dbResult;
  try {
    dbResult = await initDatabase();
  } catch (err) {
    console.log(err);
    throw err;
  }

  const { mockReportingSchema } = options;
  if (mockReportingSchema) {
    await prepareMockReportingSchema(dbResult);
    dbResult.reporting = await initReporting();
  }

  const { models, sequelize } = dbResult;

  // do NOT time out during create context
  jest.setTimeout(1000 * 60 * 60 * 24);

  await sequelize.migrate('up');

  await showError(deleteAllTestIds(dbResult));

  // populate with reference data
  const tasks = allSeeds
    .map(d => ({ code: d.name, ...d }))
    .map(d => models.ReferenceData.create(d));
  await Promise.all(tasks);

  // Order here is important, as some models depend on others
  await seedLabTests(models);
  await seedFacilities(models);
  await seedDepartments(models);
  await seedLocations(models);
  await seedLocationGroups(models);

  // Create the facility for the current config if it doesn't exist
  const [facility] = await models.Facility.findOrCreate({
    where: {
      id: config.serverFacilityId,
    },
    defaults: {
      code: 'TEST',
      name: 'Test Facility',
    },
  });

  // ensure there's a corresponding local system fact for it too
  await models.LocalSystemFact.set('facilityId', facility.id);

  const expressApp = createApp(dbResult);
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
    const newUser = await models.User.create({
      email: chance.email(),
      displayName: chance.name(),
      password: chance.string(),
      role,
    });

    return baseApp.asUser(newUser);
  };

  baseApp.asNewRole = async (permissions = [], roleOverrides = {}) => {
    const { Role, Permission } = models;
    const role = await Role.create(fake(Role), roleOverrides);
    const app = await baseApp.asRole(role.id);
    app.role = role;
    await Permission.bulkCreate(
      permissions.map(([verb, noun, objectId]) => ({
        roleId: role.id,
        userId: app.user.id,
        verb,
        noun,
        objectId,
      })),
    );
    return app;
  };

  jest.setTimeout(30 * 1000); // more generous than the default 5s but not crazy

  const centralServer = new CentralServerConnection({ deviceId: 'test' });

  const context = { ...dbResult, models, centralServer, baseApp };

  context.syncManager = new FacilitySyncManager(context);

  const close = async () => {
    await new Promise(resolve => appServer.close(resolve));
    await closeDatabase();
  };

  return { ...context, close };
}
