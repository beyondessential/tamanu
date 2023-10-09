import { DataTypes } from 'sequelize';

const TABLE = 'sync_queued_devices';

export async function up(query) {
  await query.createTable(TABLE, {
    id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    last_seen_time: { 
      type: DataTypes.DATE,
      allowNull: false,
    },
    facility_id: { 
      type: DataTypes.TEXT,
      allowNull: false,
    },
    last_synced_tick: { 
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    urgent: { 
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: { 
      type: DataTypes.TEXT,
      defaultValue: 'queued',
    },

    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  await query.addIndex(TABLE, ['id']);
  await query.addIndex(TABLE, ['last_seen_time']);
  await query.addIndex(TABLE, ['status']);
  await query.addIndex(TABLE, ['urgent']);
}

export async function down(query) {
  await query.dropTable(TABLE);
}
