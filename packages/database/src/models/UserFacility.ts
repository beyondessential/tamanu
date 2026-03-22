import { ValidationError } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

export class UserFacility extends Model {
  declare id: string;
  declare userId?: string;
  declare facilityId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
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
      } as any,
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static async create(values: any, options: any): Promise<any> {
    const { facilityId } = values;
    const existingFacility = await this.sequelize.models.Facility.findOne({
      where: { id: facilityId },
    });
    if (!existingFacility) {
      throw new ValidationError(`Invalid facilityId: ${facilityId}`, []);
    }
    return super.create(values, options);
  }

  static buildSyncFilter() {
    return null; // syncs everywhere
  }

  static async buildSyncLookupQueryDetails() {
    return null; // syncs everywhere
  }
}
