import { Sequelize } from 'sequelize';
import { REPORT_REQUEST_STATUS_VALUES, SYNC_DIRECTIONS } from 'shared/constants';
import { log } from 'shared/services/logging';
import { Model } from './Model';

export class ReportRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        reportType: { type: Sequelize.STRING, allowNull: false },
        recipients: { type: Sequelize.TEXT, allowNull: false },
        parameters: Sequelize.TEXT,
        status: { type: Sequelize.ENUM(REPORT_REQUEST_STATUS_VALUES), allowNull: false },
        error: Sequelize.TEXT,
        processStartedTime: Sequelize.DATE,
      },
      {
        ...options,
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PUSH_ONLY },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: { name: 'requestedByUserId', allowNull: false },
      onDelete: 'CASCADE',
    });
  }

  getParameters() {
    try {
      return JSON.parse(this.parameters);
    } catch (e) {
      log.warn(`Failed to parse ReportRequest parameters ${e}`);
      return {};
    }
  }

  getRecipients() {
    try {
      return JSON.parse(this.recipients);
    } catch (e) {
      // Backwards compatibility: support previous syntax of plain string
      return {
        email: this.recipients.split(','),
      };
    }
  }
}
