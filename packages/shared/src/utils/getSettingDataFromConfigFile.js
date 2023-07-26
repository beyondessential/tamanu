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

const prepareRows = (entries, facilityId, prefix = '') =>
  entries.flatMap(([key, value]) => {
    const path = `${prefix}${key}`;
    // Recursively call to get data from nested objects
    // Unless the value is an array, in which case we store the contents of array under a single key
    return isObject(value) && !isArray(value)
      ? prepareRows(Object.entries(value), facilityId, path)
      : [[path, JSON.stringify(value), ...(facilityId ? [facilityId] : [])]];
  });

export const getSettingDataFromConfigFile = async (configEnv, facilityId) => {
  const configFile = await readConfigFile(configEnv);
  const configJSON = JSON.parse(stripJsonComments(configFile.toString(), { whitespace: false }));
  return prepareRows(Object.entries(configJSON), facilityId);
};
