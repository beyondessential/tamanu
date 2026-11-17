import { injectReplacements } from 'sequelize/lib/utils/sql';
import { REPORT_DB_CONNECTION_VALUES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { getReportQueryReplacements } from '@tamanu/shared/utils/reports/getReportQueryReplacements';
import fs from 'fs';

import { toSafeFileName } from '../../utils/files';

export const sanitizeFilename = (reportName, versionNumber, format) => {
  const sanitizedName = toSafeFileName(reportName)
    .trim()
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

class VerificationRollback extends Error {}

/**
 * Checks that a report query plans successfully, without running it.
 *
 * The query is only ever planned on the unprivileged reporting connection for the report's schema,
 * inside a read-only transaction that is always rolled back. It is sent over the extended query
 * protocol, which accepts exactly one statement, and under a parenthesised EXPLAIN option list, so
 * the query cannot smuggle in ANALYZE (which would execute it) or a trailing statement.
 */
export async function verifyQuery(
  query,
  { parameters = [] } = {},
  { reportSchemaStores },
  dbSchema,
) {
  const reportStore = REPORT_DB_CONNECTION_VALUES.includes(dbSchema)
    ? reportSchemaStores?.[dbSchema]
    : undefined;
  if (!reportStore) {
    throw new InvalidOperationError(`Invalid query: unknown reporting schema "${dbSchema}"`);
  }

  const { sequelize } = reportStore;
  try {
    const replacements = await getReportQueryReplacements(parameters);
    const explainSql = injectReplacements(
      `EXPLAIN (FORMAT TEXT) ${query}`,
      sequelize.dialect,
      replacements,
    );
    await sequelize.transaction(async transaction => {
      // The raw pg client: sequelize offers no way to force the extended protocol.
      const { connection } = transaction;
      await connection.query('SET TRANSACTION READ ONLY');
      await connection.query({ text: explainSql, queryMode: 'extended' });
      throw new VerificationRollback();
    });
  } catch (err) {
    if (err instanceof VerificationRollback) return;
    throw new InvalidOperationError(`Invalid query: ${err.message}`);
  }
}
