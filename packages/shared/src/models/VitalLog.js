import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/shared/constants';

import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

export class VitalLog extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: {
          ...primaryKey,
          type: DataTypes.UUID,
        },
        previousValue: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        newValue: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        reasonForChange: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        date: dateTimeType('date', {
          allowNull: false,
          defaultValue: getCurrentDateTimeString,
        }),
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.SurveyResponseAnswer, {
      foreignKey: 'answerId',
      as: 'answer',
    });

    this.belongsTo(models.User, {
      foreignKey: 'recordedById',
      as: 'recordedBy',
    });
  }

  static buildPatientSyncFilter(patientIds, sessionConfig) {
    if (patientIds.length === 0) {
      return null;
    }

    // manually construct "joins", as survey_response and survey_response_answer
    // joins use a non-conventional join column names
    const joins = `
      INNER JOIN survey_response_answers ON vital_logs.answer_id = survey_response_answers.id
      INNER JOIN survey_responses ON survey_response_answers.response_id = survey_responses.id
      INNER JOIN encounters ON survey_responses.encounter_id = encounters.id
    `;

    // remove answers to sensitive surveys from mobile
    // this is copied over from SurveyResponseAnswer model, although VitalLog
    // is currently not used in mobile, better to get this sooner than later
    if (sessionConfig.isMobile) {
      return `
        ${joins}
        INNER JOIN surveys ON survey_responses.survey_id = surveys.id
        WHERE
          encounters.patient_id in (:patientIds)
        AND
          surveys.is_sensitive = FALSE
        AND
          ${this.tableName}.updated_at_sync_tick > :since
      `;
    }

    return `
      ${joins}
      WHERE
        encounters.patient_id in (:patientIds)
      AND
        ${this.tableName}.updated_at_sync_tick > :since
    `;
  }
}
