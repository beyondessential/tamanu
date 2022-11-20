import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { InvalidOperationError } from 'shared/errors';
import { VISIBILITY_STATUSES } from '../constants';
import { Model } from './Model';

export class LocationGroup extends Model {
  static init({ primaryKey, ...options }) {
    const validate = {
      mustHaveFacility() {
        if (!this.deletedAt && !this.facilityId) {
          throw new InvalidOperationError('A location group must have a facility.');
        }
      },
    };
    super.init(
      {
        id: primaryKey,
        code: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        visibilityStatus: {
          type: Sequelize.TEXT,
          defaultValue: VISIBILITY_STATUSES.CURRENT,
        },
      },
      {
        ...options,
        validate,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PULL_ONLY },
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });

    this.hasMany(models.Location, {
      foreignKey: 'locationGroupId',
    });
  }
}
