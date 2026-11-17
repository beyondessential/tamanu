// The replacement step sequelize.query() itself runs (sequelize/src/utils/sql.ts), needed here
// because the query is sent on the raw pg client. Its package exports expose lib/*; the report
// route tests exercise it with named parameters, so an upgrade that moves it fails in CI.
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

// SQLSTATE classes meaning the check could not run, rather than that the query is at fault:
// connection exception, insufficient resources, operator intervention, system error, internal error.
const CHECK_UNAVAILABLE_SQLSTATE_CLASSES = ['08', '53', '57', '58', 'XX'];

const isQueryFault = err =>
  Boolean(err?.severity) &&
  typeof err.code === 'string' &&
  !CHECK_UNAVAILABLE_SQLSTATE_CLASSES.includes(err.code.slice(0, 2));

const invalidQuery = err => new InvalidOperationError(`Invalid query: ${err.message}`);

const buildExplainSql = async (query, parameters, dialect) => {
  try {
    const replacements = await getReportQueryReplacements(parameters);
    return injectReplacements(`EXPLAIN (FORMAT TEXT) ${query}`, dialect, replacements);
  } catch (err) {
    throw invalidQuery(err);
  }
};

/**
 * Checks that a report query plans successfully, without running it.
 *
 * The query is only ever planned on the unprivileged reporting connection for the report's schema,
 * inside a read-only transaction that is always rolled back. It is sent over the extended query
 * protocol, which accepts exactly one statement, and under a parenthesised EXPLAIN option list, so
 * the query cannot smuggle in ANALYZE (which would execute it) or a trailing statement.
 *
 * Resolves to the query plan, one line per entry.
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
  const explainSql = await buildExplainSql(query, parameters, sequelize.dialect);

  let planLines;
  try {
    await sequelize.transaction(async transaction => {
      // The raw pg client: sequelize offers no way to force the extended protocol.
      const { connection } = transaction;
      await connection.query('SET TRANSACTION READ ONLY');
      const { rows } = await connection.query({ text: explainSql, queryMode: 'extended' });
      planLines = rows.map(row => row['QUERY PLAN']);
      throw new VerificationRollback();
    });
  } catch (err) {
    if (err instanceof VerificationRollback) return planLines;
    // Anything else, such as the reporting database being unreachable, is not the author's to fix.
    throw isQueryFault(err) ? invalidQuery(err) : err;
  }
}
