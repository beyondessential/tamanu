import jsonPrune from 'json-prune';

export const jsonParse = object => {
  try {
    return JSON.parse(jsonPrune(object));
  } catch (err) {
    throw err;
  }
};
