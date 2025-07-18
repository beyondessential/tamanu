import Sequelize, { DataTypes, QueryInterface } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'medication_requests' };

export async function up(query: QueryInterface): Promise<void> {
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
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    identifier: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    intent: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    group_identifier: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    subject: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    encounter: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    medication: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    authored_on: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    requester: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    recorder: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    note: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    dosage_instruction: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    dispense_request: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    is_live: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  await query.addIndex(TABLE, ['id', 'version_id']);
  await query.addIndex(TABLE, ['upstream_id']);

  await query.sequelize.query(`
    CREATE TRIGGER versioning BEFORE UPDATE ON fhir.${TABLE.tableName}
    FOR EACH ROW EXECUTE FUNCTION fhir.trigger_versioning()
  `);
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable(TABLE);
}
