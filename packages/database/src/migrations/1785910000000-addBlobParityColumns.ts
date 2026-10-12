import { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { tableName: 'blobs', schema: 'public' };
const INDEX = 'blobs_missing_parity';

// spec: FEC
export async function up(query: QueryInterface): Promise<void> {
  await query.addColumn(TABLE, 'has_parity', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });
  await query.addColumn(TABLE, 'correction_count', {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
  await query.addColumn(TABLE, 'last_corrected_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
  // Partial: the retrofit scan only asks for blobs without parity.
  await query.sequelize.query(
    `CREATE INDEX ${INDEX} ON blobs (last_scrubbed_at ASC NULLS FIRST) WHERE has_parity = false`,
  );
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(`DROP INDEX ${INDEX}`);
  await query.removeColumn(TABLE, 'last_corrected_at');
  await query.removeColumn(TABLE, 'correction_count');
  await query.removeColumn(TABLE, 'has_parity');
}
