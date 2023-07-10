import config from 'config';
import { DataTypes, Sequelize } from 'sequelize';
import { SURVEY_TYPES } from '../constants';
import { getCurrentDateTimeString } from '../utils/dateTime';

export async function up(query) {
  await query.createTable('vital_logs', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.fn('uuid_generate_v4'),
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    date: {
      type: DataTypes.DATETIMESTRING,
      allowNull: false,
    },
    previous_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reason_for_change: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    recorded_by_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    answer_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'survey_response_answers',
        key: 'id',
      },
    },
  });

  // Only run next part on central server
  if (config.serverFacilityId) return;

  // Insert initial logs from already registered vital surveys
  await query.sequelize.query(`
    INSERT INTO vital_logs (created_at, updated_at, date, new_value, recorded_by_id, answer_id)
    SELECT now() as created_at, now() as updated_at, COALESCE(sr.end_time, sr.start_time, '${getCurrentDateTimeString()}') as date, sra.body as new_value, sr.user_id as recorded_by_id, sra.id as answer_id
    FROM
      survey_response_answers sra
    INNER JOIN
      survey_responses sr ON sr.id = sra.response_id
    INNER JOIN
      surveys s ON s.id = sr.survey_id
    LEFT JOIN
      vital_logs vl ON vl.answer_id = sra.id
    WHERE
      sra.body IS NOT NULL
    AND
      sra.body != ''
    AND
      s.survey_type = '${SURVEY_TYPES.VITALS}'
    AND
      vl.id IS NULL;
  `);
}

export async function down(query) {
  await query.dropTable('vital_logs');
}
