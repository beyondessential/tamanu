// The replacement step sequelize.query() itself runs (sequelize/src/utils/sql.ts), needed here
// because the query is sent on the raw pg client. The package exports this path, but the built file
// is CommonJS whose named exports Node cannot see from ESM, so read it off the default export.
import sequelizeSqlUtils from 'sequelize/lib/utils/sql';
import { REPORT_DB_CONNECTION_VALUES } from '@tamanu/constants';
import { InvalidOperationError } from '@tamanu/errors';
import { getReportQueryReplacements } from '@tamanu/shared/utils/reports/getReportQueryReplacements';
import fs from 'fs';

import { toSafeFileName } from '../../utils/files';

const { injectReplacements } = sequelizeSqlUtils;

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
// connection exception, invalid authorization, invalid catalog name, insufficient resources,
// operator intervention, system error, internal error. A reporting connection that is misconfigured
// reaches us as one of these, and is no more the report author's to fix than an unreachable server.
// Class 3F (invalid schema name) is deliberately absent: a query naming a schema that does not
// exist raises it, so it is usually the query's own fault.
const CHECK_UNAVAILABLE_SQLSTATE_CLASSES = ['08', '28', '3D', '53', '57', '58', 'XX'];

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
export async function verifyQuery({ query, parameters = [], dbSchema, reportSchemaStores }) {
  const reportStore = REPORT_DB_CONNECTION_VALUES.includes(dbSchema)
    ? reportSchemaStores?.[dbSchema]
    : undefined;
  if (!reportStore) {
    // Not prefixed "Invalid query": the report's connection is the deployment's to fix, not the SQL.
    throw new InvalidOperationError(`Unknown reporting schema "${dbSchema}"`);
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
