import 'jest-expect-message';
import supertest from 'supertest';
import config from 'config';

import { FACT_FACILITY_IDS } from '@tamanu/constants/facts';
import {
  createMockReportingSchemaAndRoles,
  seedDepartments,
  seedFacilities,
  seedLabTests,
  seedLocationGroups,
  seedLocations,
  seedSettings,
} from '@tamanu/database/demoData';
import { Problem } from '@tamanu/errors';
import { ReadSettings } from '@tamanu/settings';
import { chance } from '@tamanu/fake-data/fake';
import { asNewRole, showError } from '@tamanu/shared/test-helpers';
import { initReporting } from '@tamanu/database/services/reporting';

import { createApiApp } from '../dist/createApiApp';
import { buildToken } from '../dist/middleware/auth';

import { toMatchTabularReport } from './toMatchTabularReport';
import { allSeeds } from './seed';
import { deleteAllTestIds } from './setupUtilities';

import { FacilitySyncManager } from '../dist/sync/FacilitySyncManager';
import { CentralServerConnection } from '../dist/sync/CentralServerConnection';
import { ApplicationContext } from '../dist/ApplicationContext';
import { FacilitySyncConnection } from '../dist/sync/FacilitySyncConnection';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

jest.mock('../dist/sync/CentralServerConnection');
jest.mock('../dist/utils/uploadAttachment');

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
    toBeProblemOfType(error, type) {
      if (!(error instanceof Problem)) {
        return {
          message: () => `Expected a Problem, got a ${error?.name ?? typeof error}`,
          pass: false,
        };
      }

      if (error.type !== type) {
        return {
          message: () => `Expected Problem type ${type}, got ${error.type}`,
          pass: false,
        };
      }

      return {
        message: () => `Expected Problem of type ${type}`,
        pass: true,
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

export async function createTestContext({ enableReportInstances, databaseOverrides } = {}) {
  const context = await new ApplicationContext().init({ databaseOverrides });
  // create mock reporting schema + roles if test requires it
  // init reporting instances for these roles
  if (enableReportInstances) {
    await createMockReportingSchemaAndRoles(context);
    context.reportSchemaStores = await initReporting(context.store);
  }

  const { models, sequelize } = context;

  // do NOT time out during create context
  jest.setTimeout(1000 * 60 * 60 * 24);

  await sequelize.migrate('up');

  await showError(deleteAllTestIds(context));

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
  await seedSettings(models);

  const facilityIds = selectFacilityIds(config);

  // Create the facility for the current config if it doesn't exist
  const facilities = await Promise.all(
    facilityIds.map(async facilityId => {
      const [facility] = await models.Facility.findOrCreate({
        where: {
          id: facilityId,
        },
        defaults: {
          code: facilityId,
          name: facilityId,
        },
      });
      return facility;
    }),
  );

  // Create a system user for device registration
  const systemUser = await models.User.create({
    email: 'system@test.com',
    displayName: 'System User',
    password: 'test123',
    role: 'practitioner',
  });

  const device = await models.Device.create({
    registeredById: systemUser.id,
  });

  // Add deviceId to context for createApiApp
  context.deviceId = device.id;

  const facilityIdsString = JSON.stringify(facilities.map(facility => facility.id));
  // ensure there's a corresponding local system fact for it too
  await models.LocalSystemFact.set(FACT_FACILITY_IDS, facilityIdsString);

  context.syncManager = new FacilitySyncManager(context);
  context.syncConnection = new FacilitySyncConnection();

  const { express: expressApp, server: appServer } = await createApiApp(context);
  const baseApp = supertest(appServer);

  baseApp.asUser = async user => {
    const agent = supertest.agent(expressApp);
    const token = await buildToken({
      user,
      deviceId: device.id,
      facilityId: facilityIds[0],
      expiresIn: '1d',
    });
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
    return asNewRole(baseApp, models, permissions, roleOverrides);
  };

  jest.setTimeout(30 * 1000); // more generous than the default 5s but not crazy

  const settings = facilityIds.reduce(
    (acc, facilityId) => ({
      ...acc,
      [facilityId]: new ReadSettings(models, facilityId),
    }),
    {},
  );
  settings.global = new ReadSettings(models);
  const centralServer = new CentralServerConnection({ deviceId: 'test' });

  context.onClose(async () => {
    await new Promise(resolve => {
      appServer.close(resolve);
    });
  });

  context.centralServer = centralServer;
  context.baseApp = baseApp;
  context.settings = settings;

  return context;
}
