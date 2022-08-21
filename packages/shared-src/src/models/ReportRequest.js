import { Sequelize } from 'sequelize';
import { REPORT_REQUEST_STATUS_VALUES, SYNC_DIRECTIONS } from 'shared/constants';
import { log } from 'shared/services/logging';
import { InvalidOperationError } from 'shared/errors';
import { Model } from './Model';

export class ReportRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        reportType: { type: Sequelize.STRING },
        recipients: { type: Sequelize.TEXT, allowNull: false },
        parameters: Sequelize.TEXT,
        status: { type: Sequelize.ENUM(REPORT_REQUEST_STATUS_VALUES), allowNull: false },
        error: Sequelize.TEXT,
        processStartedTime: Sequelize.DATE,
      },
      {
        ...options,
        validate: {
          // Must have
          hasReportId: () => {
            // No validation on deleted records
            if (!this.deletedAt) return;

            if (!this.versionId && !this.reportType) {
              throw new InvalidOperationError(
                'A report request must have either a reportType or a versionId',
              );
            }
            if (this.versionId && this.reportType) {
              throw new InvalidOperationError(
                'A report request must have either a reportType or a versionId, not both',
              );
            }
          },
        },
        syncConfig: { syncDirection: SYNC_DIRECTIONS.PUSH_ONLY },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.User, {
      foreignKey: { name: 'requestedByUserId', allowNull: false },
      onDelete: 'CASCADE',
    });
    this.belongsTo(models.Facility);
    this.belongsTo(models.ReportDefinitionVersion);
  }

  getReportId() {
    return this.versionId || this.reportType;
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
