import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'blobs', schema: 'public' };
const INDEX = 'blobs_last_scrubbed_at';

// spec: SCRUB
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'last_scrubbed_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
  // Raw SQL rather than addIndex: a default NULLS LAST index doesn't serve the NULLS FIRST scan.
  await query.sequelize.query(
    `CREATE INDEX ${INDEX} ON blobs (last_scrubbed_at ASC NULLS FIRST)`,
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP INDEX ${INDEX}`);
  await query.removeColumn(TABLE, 'last_scrubbed_at');
}
