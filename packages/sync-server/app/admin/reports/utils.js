import { QueryTypes } from 'sequelize';
import { getReportQueryReplacements } from '@tamanu/shared/utils/reports/getReportQueryReplacements';
import fs from 'fs';

export const sanitizeFilename = (reportName, versionNumber, format) => {
  const sanitizedName = reportName
    .trim()
    .replace(/[/?<>\\:*|"]/g, '')
    .replace(/(\s|-)+/g, '-')
    .toLowerCase();
  return `${sanitizedName}-v${versionNumber}.${format}`;
};

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

export async function verifyQuery(query, paramDefinitions, store) {
  try {
    const replacements = await getReportQueryReplacements(store, paramDefinitions);
    // use EXPLAIN instead of PREPARE because we don't want to stuff around deallocating the statement
    await store.sequelize.query(`EXPLAIN ${query}`, {
      type: QueryTypes.SELECT,
      replacements,
    });
  } catch (err) {
    throw new Error(`Invalid query: ${err.message}`);
  }
}
