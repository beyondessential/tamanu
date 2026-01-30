import { DataTypes } from 'sequelize';
import { PATIENT_ISSUE_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateType, type InitOptions, type Models } from '../types/model';

const PATIENT_ISSUE_TYPE_VALUES = Object.values(PATIENT_ISSUE_TYPES);
export class PatientIssue extends Model {
  declare id: string;
  declare note?: string;
  declare recordedDate: string;
  declare type: (typeof PATIENT_ISSUE_TYPE_VALUES)[number];

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        note: DataTypes.STRING,
        recordedDate: dateType('recordedDate', {
          defaultValue: getCurrentDateString,
          allowNull: false,
        }),
        type: {
          type: DataTypes.ENUM(...PATIENT_ISSUE_TYPE_VALUES),
          defaultValue: PATIENT_ISSUE_TYPES.ISSUE,
          allowNull: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
  }

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
