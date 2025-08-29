import { DataTypes, QueryInterface, Sequelize } from 'sequelize';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  await query.createTable('portal_survey_assignments', {
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
    survey_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'surveys',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: PORTAL_SURVEY_ASSIGNMENTS_STATUSES.OUTSTANDING,
    },
    assigned_at: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    assigned_by_id: {
      type: DataTypes.TEXT,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    survey_response_id: {
      type: DataTypes.TEXT,
      allowNull: true,
      references: {
        model: 'survey_responses',
        key: 'id',
      },
    },
  });

  await query.addIndex('portal_survey_assignments', ['patient_id', 'survey_id'], {
    name: 'idx_patient_id_status',
  });
}

export async function down(query: QueryInterface): Promise<void> {
  await query.dropTable('portal_survey_assignments');
}
