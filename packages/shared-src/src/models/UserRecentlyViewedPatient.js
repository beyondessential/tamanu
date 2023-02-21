import { Op } from 'sequelize';

import { SYNC_DIRECTIONS } from 'shared/constants';

import { Model } from './Model';

export class UserRecentlyViewedPatient extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      { syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL, ...options },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });

    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  }

  static async create(data) {
    const currentUserRecentlyViewedPatients = await this.findAll({
      where: {
        userId: {
          [Op.eq]: data.userId,
        },
      },
      order: [['updatedAt', 'DESC']],
    });

    const existingRelation = currentUserRecentlyViewedPatients.find(
      relation => relation.patientId === data.patientId,
    );

    if (existingRelation) {
      existingRelation.changed('updatedAt', true);

      return this.sequelize.transaction(async () => {
        return existingRelation.update({ updatedAt: new Date() });
      });
    }

    return this.sequelize.transaction(async () => {
      return super.create(data);
    });
  }
}
