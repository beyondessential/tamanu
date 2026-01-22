import { DataTypes } from 'sequelize';
import {
  REPORT_EXPORT_FORMATS,
  REPORT_REQUEST_STATUS_VALUES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';
import { InvalidOperationError } from '@tamanu/errors';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';

const REPORT_EXPORT_FORMAT_VALUES = Object.values(REPORT_EXPORT_FORMATS);

export class ReportRequest extends Model {
  declare id: string;
  declare reportType?: string;
  declare recipients: string;
  declare parameters?: string;
  declare status: (typeof REPORT_REQUEST_STATUS_VALUES)[number];
  declare exportFormat: (typeof REPORT_EXPORT_FORMAT_VALUES)[number];
  declare error?: string;
  declare processStartedTime?: Date;
  declare requestedByUserId?: string;
  declare facilityId?: string;
  declare reportDefinitionVersionId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        reportType: { type: DataTypes.STRING },
        recipients: { type: DataTypes.TEXT, allowNull: false },
        parameters: DataTypes.TEXT,
        status: { type: DataTypes.ENUM(...REPORT_REQUEST_STATUS_VALUES), allowNull: false },
        exportFormat: {
          type: DataTypes.ENUM(...REPORT_EXPORT_FORMAT_VALUES),
          allowNull: false,
          defaultValue: REPORT_EXPORT_FORMATS.XLSX,
        },
        error: DataTypes.TEXT,
        processStartedTime: DataTypes.DATE,
      },
      {
        ...options,
        validate: {
          // Must have
          hasReportId: () => {
            // No validation on deleted records
            if (!(this as any).deletedAt) return;

            if (!(this as any).reportDefinitionVersionId && !(this as any).reportType) {
              throw new InvalidOperationError(
                'A report request must have either a reportType or a reportDefinitionVersionId',
              );
            }
            if ((this as any).reportDefinitionVersionId && (this as any).reportType) {
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

  static initRelations(models: Models) {
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
      return JSON.parse(this.parameters!);
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
