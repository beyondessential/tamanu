import { Sequelize } from 'sequelize';
import { REPORT_REQUEST_STATUS_VALUES, SYNC_DIRECTIONS } from 'shared/constants';
import { log } from 'shared/services/logging';
import { Model } from './Model';
import { InvalidOperationError } from 'shared/errors';

export class ReportRequest extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        legacyReportType: {
          type: Sequelize.STRING,
          allowNull: true,
        },
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

            if (!this.versionId && !this.legacyReportType) {
              throw new InvalidOperationError(
                'A report request must have either a legacyReportType or a versionId',
              );
            }
            if (this.versionId && this.legacyReportType) {
              throw new InvalidOperationError(
                'A report request must have either a legacyReportType or a versionId, not both',
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
    this.belongsTo(models.Facility, {
      foreignKey: 'facilityId',
      as: 'facility',
    });
    this.belongsTo(models.ReportDefinitionVersion, {
      foreignKey: 'versionId',
      as: 'version',
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
