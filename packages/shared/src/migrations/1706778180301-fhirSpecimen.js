import { DataTypes, Sequelize } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'specimens' };

export async function up(query) {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    version_id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    upstream_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    collection: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    sample_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    request: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    type: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  });

  await query.addIndex(TABLE, ['id', 'version_id']);
  await query.addIndex(TABLE, ['upstream_id'], { unique: true });

  await query.sequelize.query(`
    CREATE TRIGGER versioning BEFORE UPDATE ON fhir.${TABLE.tableName}
    FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning()
  `);
}

export async function down(query) {
  await query.dropTable(TABLE);
}