import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class SyncSessionRecord extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        direction: { type: DataTypes.STRING },
        recordType: { type: DataTypes.STRING },
        recordId: { type: DataTypes.STRING },
        isDeleted: { type: DataTypes.BOOLEAN },
        // savedAtSyncTick is used to check whether record has been updated between incoming and
        // outgoing phase of a single session
        savedAtSyncTick: { type: DataTypes.BIGINT },
        // updatedAtByFieldSum is used to check whether record has had changes to field during
        // merge and save component of push phase
        updatedAtByFieldSum: { type: DataTypes.BIGINT },
        data: { type: DataTypes.JSON },
      },
      { ...options, syncDirection: SYNC_DIRECTIONS.DO_NOT_SYNC },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.SyncSession, {
      foreignKey: 'sessionId',
    });
  }
}
