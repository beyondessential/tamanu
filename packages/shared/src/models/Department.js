import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS, VISIBILITY_STATUSES } from '@tamanu/constants';
import { InvalidOperationError } from '../errors';
import { Model } from './Model';

export class Department extends Model {
  static init({ primaryKey, ...options }) {
    const validate = {
      mustHaveFacility() {
        if (!this.deletedAt && !this.facilityId) {
          throw new InvalidOperationError('A department must have a facility.');
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
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models) {
    this.hasMany(models.Encounter, {
      foreignKey: 'departmentId',
    });

    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
    });
  }
}
