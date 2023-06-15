import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '../constants';
import { Model } from './Model';
import { dateType } from './dateTimeTypes';
import { getCurrentDateString } from '../utils/dateTime';

export class PatientLetterTemplate extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        dateCreated: dateType('dateCreated', {
          defaultValue: getCurrentDateString,
        }),
        title: {
          type: Sequelize.STRING,
        },
        body: {
          type: Sequelize.STRING,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: 'createdById',
      as: 'createdBy',
    });
  }

  static getListReferenceAssociations() {
    return ['createdBy'];
  }
}
