/* eslint-disable no-undef */

const { Problem } = require('@tamanu/errors');

require('jest-expect-message');

globalThis.crypto = require('crypto');

// TextDecoder is undefined in jest environment
// Required for cbor
const { TextDecoder } = require('util');

global.TextDecoder = TextDecoder;

jest.setTimeout(30 * 1000); // more generous than the default 5s but not crazy
jest.mock('../dist/utils/getFreeDiskSpace');

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
    const pass = statusCode >= 400 && (statusCode < 500 || match);
    let expectedText = 'Expected 4xx error status code';
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
