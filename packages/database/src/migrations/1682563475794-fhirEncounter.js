import { DataTypes, Sequelize } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'encounters' };

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
    status: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    class: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    actual_period: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    subject: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  });

  await query.addIndex(TABLE, ['id', 'version_id']);
  await query.addIndex(TABLE, ['upstream_id'], { unique: true });
}

export async function down(query) {
  await query.dropTable(TABLE);
}
