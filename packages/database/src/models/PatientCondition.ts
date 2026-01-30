import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateType, type InitOptions, type Models } from '../types/model';

export class PatientCondition extends Model {
  declare id: string;
  declare note?: string;
  declare recordedDate: string;
  declare resolved: boolean;
  declare resolutionDate?: string;
  declare resolutionNote?: string;
  declare patientId?: string;
  declare conditionId?: string;
  declare examinerId?: string;
  declare resolutionPractitionerId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        note: DataTypes.STRING,
        recordedDate: dateType('recordedDate', {
          defaultValue: getCurrentDateString,
          allowNull: false,
        }),
        resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
        resolutionDate: dateType('resolutionDate', {
          defaultValue: getCurrentDateString,
          allowNull: true,
        }),
        resolutionNote: DataTypes.TEXT,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'conditionId', as: 'condition' });
    this.belongsTo(models.User, { foreignKey: 'examinerId' });
    this.belongsTo(models.User, { foreignKey: 'resolutionPractitionerId' });
  }

  static getListReferenceAssociations() {
    return ['condition'];
  }

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
