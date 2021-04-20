import { Sequelize } from 'sequelize';
import { REPORT_REQUEST_STATUS_VALUES, SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';

export class ReportRequest extends Model {
  static syncDirection = SYNC_DIRECTIONS.PUSH_ONLY;

  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        reportType: { type: Sequelize.STRING, allowNull: false },
        recipients: { type: Sequelize.TEXT, allowNull: false },
        parameters: Sequelize.TEXT,
        status: { type: Sequelize.ENUM(REPORT_REQUEST_STATUS_VALUES), allowNull: false },
      },
      {
        ...options,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: { name: 'requestedByUserId', allowNull: false },
      onDelete: "CASCADE",
    });
  }
}
