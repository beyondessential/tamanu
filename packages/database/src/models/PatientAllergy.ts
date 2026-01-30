import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateType, type InitOptions, type Models } from '../types/model';

export class PatientAllergy extends Model {
  declare id: string;
  declare note?: string;
  declare recordedDate: string;
  declare patientId?: string;
  declare practitionerId?: string;
  declare allergyId?: string;
  declare reactionId?: string;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        note: DataTypes.STRING,
        recordedDate: dateType('recordedDate', {
          defaultValue: getCurrentDateString,
          allowNull: false,
        }),
      },
      {
        ...options,   
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.User, { foreignKey: 'practitionerId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'allergyId', as: 'allergy' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'reactionId', as: 'reaction' });
  }

  static getListReferenceAssociations() {
    return ['allergy', 'reaction'];
  }

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
