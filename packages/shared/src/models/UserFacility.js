import { ValidationError } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';

export class UserFacility extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.PULL_FROM_CENTRAL,
        uniqueKeys: {
          user_location_unique: {
            fields: ['user_id', 'facility_id'],
          },
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static async create(values, options) {
    const { facilityId } = values;
    const existingFacility = await this.sequelize.models.Facility.findOne({
      where: { id: facilityId },
    });
    if (!existingFacility) {
      throw new ValidationError(`Invalid facilityId: ${facilityId}`);
    }
    return super.create(values, options);
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }
}
