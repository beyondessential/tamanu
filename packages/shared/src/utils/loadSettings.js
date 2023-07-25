import stripJsonComments from 'strip-json-comments';
import { readFile } from 'fs/promises';
import { isArray, isObject } from 'lodash';

export const CONFIG_ENVS = {
  DEFAULT: 'default',
  LOCAL: 'local',
};

const readConfigFile = async configEnv => {
  try {
    return await readFile(`config/${configEnv}.json`);
  } catch (e) {
    throw new Error(`Failed to read ${configEnv} config json ${e}`);
  }
};

const prepareRows = (entries, facilityId) => {
  const stack = entries.map(([key, value]) => [key, value, '', false]);
  const result = [];

  while (stack.length > 0) {
    const [key, value, prefix, keyIsIndex] = stack.pop();
    const path = `${prefix}${keyIsIndex ? `[${key}]` : `${prefix && '.'}${key}`}`;

    if (isObject(value)) {
      const newEntries = Object.entries(value);
      const newKeyIsIndex = isArray(value);
      for (const [newKey, newValue] of newEntries) {
        stack.push([newKey, newValue, path, newKeyIsIndex]);
      }
    } else {
      result.push([path, JSON.stringify(value), ...(facilityId ? [facilityId] : [])]);
    }
  }

  return result;
};

export const getInsertDataFromConfigFile = async (configEnv, facilityId) => {
  const configFile = await readConfigFile(configEnv);
  const configJSON = JSON.parse(stripJsonComments(configFile.toString()));
  return prepareRows(Object.entries(configJSON), facilityId);
};
