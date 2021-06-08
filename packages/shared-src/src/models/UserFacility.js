import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class UserFacility extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
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
    const existingFacility = await this.sequelize.models.ReferenceData.findOne({
      where: {
        id: facilityId,
        type: 'facility',
      },
    });
    if (!existingFacility) {
      throw new ValidationError(`Invalid facilityId: ${facilityId}`);
    }
    return super.create(values, options);
  }

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;
}
