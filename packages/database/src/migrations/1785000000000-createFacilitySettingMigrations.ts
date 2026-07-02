import { DataTypes, QueryInterface, Sequelize } from 'sequelize';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('facility_setting_migrations', {
    id: {
      // Deterministic composite id ("facilityId;key", see the upgrade step), so the
      // migration produces identical rows every run — a random UUID pk would fail the
      // migration-determinism check.
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('now'),
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    key: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    facility_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'facilities',
        key: 'id',
      },
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('facility_setting_migrations');
}
