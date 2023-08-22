import { DataTypes, Sequelize } from 'sequelize';

const TABLE = { schema: 'fhir', tableName: 'practitioners' };

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
    identifier: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    name: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    telecom: {
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
