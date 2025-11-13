import React from 'react';
import { parse, tokensToRegExp } from 'path-to-regexp';
import { ApiContext } from '@tamanu/ui-components';

const wait = duration =>
  new Promise(resolve => {
    setTimeout(resolve, duration);
  });

function createMockedApi(endpoints) {
  const matchers = Object.entries(endpoints).map(([endpoint, callback]) => {
    return { matcher: tokensToRegExp(parse(endpoint)), callback };
  });

  const getHandler = url => {
    for (const { matcher, callback } of matchers) {
      const match = matcher.exec(url);
      if (match) {
        return {
          params: match.slice(1),
          callback,
        };
      }
    }
    return {};
  };

  const request = async (url, data) => {
    const { callback, params } = getHandler(url);
    await wait(500);
    if (!callback) {
      throw new Error(`Not found: ${url}`);
    }
    return callback(data, ...params);
  };

  return {
    get: request,
    post: request,
    put: request,
  };
}

export const MockedApi = ({ endpoints, ...props }) => (
  <ApiContext.Provider value={createMockedApi(endpoints)} {...props} />
);
