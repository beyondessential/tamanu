import jsonPrune from 'json-prune';
import { schemas } from '../schemas';

export * from './parse-object';

export const jsonParse = (object) => {
  try {
    return JSON.parse(jsonPrune(object));
  } catch (err) {
    throw err;
  }
};

export const findSchema = (type) => schemas.find(schema => schema.name === type);
