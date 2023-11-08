import { Sequelize } from 'sequelize';
import {
  REPORT_REQUEST_STATUS_VALUES,
  SYNC_DIRECTIONS,
  REPORT_EXPORT_FORMATS,
} from '@tamanu/constants';
import { log } from '../services/logging';
import { InvalidOperationError } from '../errors';
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
        exportFormat: {
          type: Sequelize.ENUM(Object.values(REPORT_EXPORT_FORMATS)),
          allowNull: false,
          defaultValue: REPORT_EXPORT_FORMATS.XLSX,
        },
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

            if (!this.reportDefinitionVersionId && !this.reportType) {
              throw new InvalidOperationError(
                'A report request must have either a reportType or a reportDefinitionVersionId',
              );
            }
            if (this.reportDefinitionVersionId && this.reportType) {
              throw new InvalidOperationError(
                'A report request must have either a reportType or a reportDefinitionVersionId, not both',
              );
            }
          },
        },
        syncDirection: SYNC_DIRECTIONS.PUSH_TO_CENTRAL,
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
      foreignKey: 'reportDefinitionVersionId',
      as: 'reportDefinitionVersion',
    });
  }

  getReportId() {
    return this.reportDefinitionVersionId || this.reportType;
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
