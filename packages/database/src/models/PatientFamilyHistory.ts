import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

export class PatientFamilyHistory extends Model {
  declare id: string;
  declare note?: string;
  declare recordedDate: string;
  declare relationship?: string;
  declare patientId?: string;
  declare practitionerId?: string;
  declare diagnosisId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        note: DataTypes.STRING,
        recordedDate: dateTimeType('recordedDate', {
          defaultValue: getCurrentDateTimeString,
          allowNull: false,
        }),
        relationship: DataTypes.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    this.belongsTo(models.User, { foreignKey: 'practitionerId', as: 'practitioner' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'diagnosisId', as: 'diagnosis' });
  }

  static getListReferenceAssociations() {
    return ['diagnosis'];
  }

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
