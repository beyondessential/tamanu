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

const getDataFromEntries = (entries, facilityId, prefix = '', keyIsIndex = false) => {
  return entries.flatMap(([key, value]) => {
    const path = `${prefix}${keyIsIndex ? `[${key}]` : `${prefix && '.'}${key}`}`;
    // Recursive call to get data from nested objects
    return isObject(value)
      ? getDataFromEntries(Object.entries(value), facilityId, path, isArray(value))
      : [[path, JSON.stringify(value), ...(facilityId ? [facilityId] : [])]];
  });
};

export const getEntriesFromConfigFile = async (configEnv, facilityId) => {
  const configFile = await readConfigFile(configEnv);
  const configJSON = JSON.parse(stripJsonComments(configFile.toString()));
  return getDataFromEntries(Object.entries(configJSON), facilityId);
};
