import { QueryTypes } from 'sequelize';
import { REPORT_DB_CONNECTION_ROLES, REPORT_DB_CONNECTION_SCHEMAS } from '@tamanu/constants';
import { repairReportingGrants } from '@tamanu/database/services/reporting';
import { createTestContext } from '../utilities';

const ROLE = REPORT_DB_CONNECTION_ROLES.reporting;
const SCHEMA = REPORT_DB_CONNECTION_SCHEMAS.reporting;
const TEST_TABLE = `${SCHEMA}.grant_repair_test_table`;

// A reporting schema script opens with `DROP SCHEMA reporting CASCADE`, which takes the
// schema's ACL and its default privileges with it. Jest workers share a database, so
// these revoke the grants directly rather than dropping the schema out from under
// another suite; the state left behind is the same one the drop leaves.
describe('repairReportingGrants', () => {
  let ctx;
  let sequelize;

  beforeAll(async () => {
    ctx = await createTestContext({ enableReportInstances: true });
    sequelize = ctx.sequelize;
    await sequelize.query(`CREATE TABLE ${TEST_TABLE} ("id" integer PRIMARY KEY);`);
  });

  afterAll(async () => {
    await sequelize.query(`DROP TABLE IF EXISTS ${TEST_TABLE};`);
    await ctx.close();
  });

  const reportingRoleCanRead = async () => {
    const [privileges] = await sequelize.query(
      `SELECT has_schema_privilege(:role, :schema, 'USAGE') AS "hasUsage",
              has_table_privilege(:role, :table, 'SELECT') AS "canSelect";`,
      {
        replacements: { role: ROLE, schema: SCHEMA, table: TEST_TABLE },
        type: QueryTypes.SELECT,
      },
    );
    return privileges.hasUsage && privileges.canSelect;
  };

  const stripSchemaGrants = () =>
    sequelize.query(`
      REVOKE USAGE ON SCHEMA ${SCHEMA} FROM ${ROLE};
      REVOKE SELECT ON ALL TABLES IN SCHEMA ${SCHEMA} FROM ${ROLE};
      ALTER DEFAULT PRIVILEGES IN SCHEMA ${SCHEMA} REVOKE SELECT ON TABLES FROM ${ROLE};
    `);

  it('re-applies grants a schema rebuild removed', async () => {
    await stripSchemaGrants();
    expect(await reportingRoleCanRead()).toBe(false);

    const repaired = await repairReportingGrants({ sequelize });

    expect(repaired).toContain('reporting');
    expect(await reportingRoleCanRead()).toBe(true);
  });

  it('covers tables created after the rebuild', async () => {
    await stripSchemaGrants();
    await repairReportingGrants({ sequelize });
    await sequelize.query(`CREATE TABLE ${SCHEMA}.grant_repair_later_table ("id" integer);`);

    const [privileges] = await sequelize.query(
      `SELECT has_table_privilege(:role, :table, 'SELECT') AS "canSelect";`,
      {
        replacements: { role: ROLE, table: `${SCHEMA}.grant_repair_later_table` },
        type: QueryTypes.SELECT,
      },
    );
    await sequelize.query(`DROP TABLE ${SCHEMA}.grant_repair_later_table;`);

    expect(privileges.canSelect).toBe(true);
  });

  it('does nothing when the grants are intact', async () => {
    await repairReportingGrants({ sequelize });

    // Not an empty-array assertion: suites sharing this database churn `public`, which
    // the raw connection also covers.
    expect(await repairReportingGrants({ sequelize })).not.toContain('reporting');
  });
});
