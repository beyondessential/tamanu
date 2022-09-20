import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class SessionSyncRecord extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        direction: { type: Sequelize.STRING },
        recordType: { type: Sequelize.STRING },
        recordId: { type: Sequelize.STRING },
        isDeleted: { type: Sequelize.BOOLEAN },
        data: { type: Sequelize.JSON },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }


  static initRelations(models) {
    this.belongsTo(models.SyncSession, {
      foreignKey: 'sesssionId',
    });
  }
}
