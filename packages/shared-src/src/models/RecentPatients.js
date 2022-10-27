import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class RecentPatients extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: { name: 'userId', allowNull: false },
    });
    this.belongsTo(models.Patient, {
      foreignKey: { name: 'patientId', allowNull: false },
    });
  }

  static async getForUser(userId) {
    const { models } = this.sequelize;
    return this.findAll({
      where: { userId },
      limit: 12,
      order: [['created_at', 'DESC']],
      include: models.Patient,
    });
  }
}
