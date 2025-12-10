import { DataTypes, QueryInterface, Sequelize } from 'sequelize';
import { VISIBILITY_STATUSES, PORTAL_USER_STATUSES } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('portal_users', {
    id: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 6),
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.fn('current_timestamp', 6),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    patient_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    visibility_status: {
      type: DataTypes.TEXT,
      defaultValue: VISIBILITY_STATUSES.CURRENT,
    },
    status: {
      type: DataTypes.TEXT,
      defaultValue: PORTAL_USER_STATUSES.PENDING,
      allowNull: false,
    },
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('portal_users');
}
