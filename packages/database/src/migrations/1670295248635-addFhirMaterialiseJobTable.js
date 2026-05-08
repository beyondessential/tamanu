import Sequelize, { DataTypes } from 'sequelize';

const INDEX = ['fhir_materialise_jobs', ['upstream_id', 'resource']];
const TABLE_NAME = 'fhir_materialise_jobs';

export async function up(query) {
  await query.createTable(TABLE_NAME, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    deleted_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    // queue-related fields
    status: {
      type: DataTypes.STRING,
      defaultValue: 'Queued',
      allowNull: false,
    },
    started_at: DataTypes.DATE,
    completed_at: DataTypes.DATE,
    errored_at: DataTypes.DATE,
    error: DataTypes.TEXT,

    // data fields
    upstream_id: DataTypes.STRING,
    resource: DataTypes.STRING,
  });
  await query.addIndex(...INDEX, {
    unique: 'true',
    where: { status: 'Queued' },
  });
}

export async function down(query) {
  await query.dropTable(TABLE_NAME);
}
