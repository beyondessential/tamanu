/* eslint-disable no-undef */

require('jest-expect-message');
const jestExtendedMatchers = require('jest-extended');

// TextDecoder is undefined in jest environment
// Required for cbor
const { TextDecoder } = require('util');

global.TextDecoder = TextDecoder;

jest.setTimeout(30 * 1000); // more generous than the default 5s but not crazy
jest.mock('../app/utils/getFreeDiskSpace');

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
