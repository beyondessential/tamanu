import supertest from 'supertest';
import Chance from 'chance';
import http from 'http';

import { seedDepartments, seedFacilities, seedLocations, seedLabTests } from 'shared/demoData';

import { createApp } from 'lan/app/createApp';
import { initDatabase, closeDatabase } from 'lan/app/database';
import { getToken } from 'lan/app/middleware/auth';

import { allSeeds } from './seed';
import { deleteAllTestIds } from './setupUtilities';

import { SyncManager } from '~/sync';
import { WebRemote } from '~/sync/WebRemote';

jest.mock('~/sync/WebRemote');
jest.mock('../app/utils/uploadAttachment');

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
    toMatchTabularReport(receivedReport, expectedData) {
      /**
       * Usage:
       *  expect(reportData).toMatchTabularReport(
       *    reportColumnTemplate, // TODO: should we pass this - or rely on object ordering?
       *    [
       *      {
       *        Date: '2020-02-18',
       *        "Number of patients screened": 12,
       *      },
       *    ],
       *  );
       *
       */
      if (this.isNot || this.promise) {
        throw new Error('toMatchTabularReport does not support promises or "not" yet');
      }
      const [receivedHeadings, ...receivedData] = receivedReport;

      const buildErrorMessage = errorList => () =>
        `${this.utils.matcherHint(
          'toMatchTabularReport',
          undefined,
          undefined,
          {},
        )}\n${errorList.join('\n')}`;

      if (expectedData.length === 0) {
        return {
          pass: receivedData.length === 0,
          message: buildErrorMessage([
            `Expected an empty report, received: ${receivedData.length} rows`,
          ]),
        };
      }
      // Note: this line requires that the keys in `expectedData` are ordered
      const propertyList = Object.keys(expectedData[0]);

      if (!this.equals(receivedHeadings, propertyList)) {
        return {
          pass: false,
          message: buildErrorMessage([
            `Incorrect columns,\nReceived: ${receivedHeadings}\nExpected: ${propertyList}`,
          ]),
        };
      }

      let pass = true;
      const errors = [];

      if (receivedData.length !== expectedData.length) {
        pass = false;
        errors.push(
          `Incorrect number of rows: Received: ${receivedData.length}, Expected: ${expectedData.length}`,
        );
        // No point continuing - there's nothing to test
        if (receivedData.length === 0) return { pass, message: buildErrorMessage(errors) };
      }

      const keyToIndex = propertyList.reduce((acc, prop, i) => ({ ...acc, [prop]: i }), {});
      const getProperty = (row, prop) => row[keyToIndex[prop]];

      expectedData.forEach((expectedRow, i) => {
        const receivedRow = receivedData[i];
        Object.entries(expectedRow).forEach(([key, expectedValue]) => {
          const receivedValue = getProperty(receivedRow, key);
          if (receivedValue !== expectedValue) {
            errors.push(
              `Row: ${i}, Key: ${key},  Expected: ${this.utils.printExpected(
                expectedValue,
              )}, Received: ${this.utils.printReceived(receivedValue)}`,
            );
            pass = false;
          }
        });
      });

      return {
        pass,
        message: buildErrorMessage(errors),
      };
    },
  });
}

export async function createTestContext() {
  const dbResult = await initDatabase();
  const { models, sequelize } = dbResult;

  // do NOT time out during create context
  jest.setTimeout(1000 * 60 * 60 * 24);

  // sync db and remove old test data
  await sequelize.sync();
  await deleteAllTestIds(dbResult);

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

  jest.setTimeout(30 * 1000); // more generous than the default 5s but not crazy

  const remote = new WebRemote();

  const context = { baseApp, sequelize, models, remote };

  context.syncManager = new SyncManager(context);

  const close = async () => {
    await new Promise(resolve => appServer.close(resolve));
    await closeDatabase();
  };

  return { ...context, close };
}
