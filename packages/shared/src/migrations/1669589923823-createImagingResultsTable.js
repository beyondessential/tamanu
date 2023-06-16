import { DataTypes, Sequelize } from 'sequelize';
// TODO: shouldn't import config in migrations (it makes db schema state underivable without knowing config across the whole history of the deployment)
// See SAV-77
import config from 'config';

export async function up(query) {
  await query.createTable('imaging_results', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 3),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    updated_at_sync_tick: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    visibility_status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: 'current',
    },

    imaging_request_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'imaging_requests',
        key: 'id',
      },
    },
    completed_by_id: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    external_code: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  await query.renameColumn('imaging_requests', 'results', 'legacy_results');
  if (!config.serverFacilityId) {
    // only insert imaging_results on the central server
    // facility servers can sync new results down
    await query.sequelize.query(`
      INSERT INTO imaging_results (id, created_at, updated_at, imaging_request_id, description)
      SELECT uuid_generate_v4(), ir.updated_at, ir.updated_at, ir.id, ir.legacy_results FROM imaging_requests ir
      WHERE ir.legacy_results IS NOT NULL AND ir.legacy_results != '';
  `);
  }
}

export async function down(query) {
  await query.renameColumn('imaging_requests', 'legacy_results', 'results');
  await query.dropTable('imaging_results');
}
