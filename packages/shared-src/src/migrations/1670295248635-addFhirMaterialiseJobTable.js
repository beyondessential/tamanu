import Sequelize, { DataTypes } from 'sequelize';

export async function up(query) {
  await query.createTable(
    'fhir_materialise_jobs',
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
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
      },
      began_at: DataTypes.DATE,
      completed_at: DataTypes.DATE,
      errored_at: DataTypes.DATE,
      error: DataTypes.TEXT,

      // data fields
      upstream_id: DataTypes.STRING,
      resource: DataTypes.STRING,
    },
    {
      indexes: [
        {
          unique: 'true',
          fields: ['upstreamId', 'resource'],
          where: { status: 'Queued' },
        },
      ],
    },
  );
}

export async function down(query) {
  await query.dropTable('fhir_materialise_jobs');
}
