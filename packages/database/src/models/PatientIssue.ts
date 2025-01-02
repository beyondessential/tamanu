import { DataTypes } from 'sequelize';
import { PATIENT_ISSUE_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { dateTimeType, type InitOptions, type Models } from '../types/model';

const PATIENT_ISSUE_TYPE_VALUES = Object.values(PATIENT_ISSUE_TYPES);
export class PatientIssue extends Model {
  id!: string;
  note?: string;
  recordedDate!: string;
  type!: (typeof PATIENT_ISSUE_TYPE_VALUES)[number];

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        note: DataTypes.STRING,
        recordedDate: dateTimeType('recordedDate', {
          defaultValue: getCurrentDateTimeString,
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

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
