import { QueryTypes } from 'sequelize';
import { getQueryReplacementsFromParams } from 'shared/utils/getQueryReplacementsFromParams';
import fs from 'fs';

export const readJSON = async path => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (parseError) {
          reject(parseError);
        }
      }
    });
  });
};

export async function verifyQuery(query, paramDefinitions = [], store) {
  try {
    // use EXPLAIN instead of PREPARE because we don't want to stuff around deallocating the statement
    await store.sequelize.query(`EXPLAIN ${query}`, {
      type: QueryTypes.SELECT,
      replacements: getQueryReplacementsFromParams(paramDefinitions),
    });
  } catch (err) {
    throw new Error(`Invalid query: ${err.message}`);
  }
}
