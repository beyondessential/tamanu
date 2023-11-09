import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { Model } from './Model';
import { dateType } from './dateTimeTypes';
import { getCurrentDateString } from '../utils/dateTime';

export class PatientLetterTemplate extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        dateCreated: dateType('dateCreated', {
          defaultValue: getCurrentDateString,
        }),
        title: {
          type: Sequelize.TEXT,
        },
        body: {
          type: Sequelize.TEXT,
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

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
