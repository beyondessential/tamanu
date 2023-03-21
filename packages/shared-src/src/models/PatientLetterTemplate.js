import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class PatientLetterTemplate extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
        },
        title: {
          type: Sequelize.STRING,
        },
        body: {
          type: Sequelize.STRING,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }
}
