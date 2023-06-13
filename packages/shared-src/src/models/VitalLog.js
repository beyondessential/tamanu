import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';

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
}
