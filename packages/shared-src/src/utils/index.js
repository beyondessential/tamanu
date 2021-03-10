import jsonPrune from 'json-prune';

export * from './getResponseJsonSafely';
export * from './parse-object';
export * from './valueIndex';

export const jsonParse = object => {
  try {
    return JSON.parse(jsonPrune(object));
  } catch (err) {
    throw err;
  }
};
