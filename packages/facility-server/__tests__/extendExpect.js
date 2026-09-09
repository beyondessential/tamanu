import { Problem } from '@tamanu/errors';

import { toMatchTabularReport } from './toMatchTabularReport';

// Kept out of ./utilities so the setup file can register the matchers without importing the
// facility app's module graph: a module a setup file imports is already cached by the time a
// test file runs, which would put it beyond the reach of the mocks registered there.

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
