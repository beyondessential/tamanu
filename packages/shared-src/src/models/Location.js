import { Sequelize, ValidationError } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class Location extends Model {
  static init({ primaryKey, ...options }) {
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
      },
      {
        ...options,
        indexes: [{ unique: true, fields: ['code'] }],
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.ReferenceData, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
  }

  static async create(values) {
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
    return super.create(values);
  }

  static syncDirection = SYNC_DIRECTIONS.PULL_ONLY;
}
