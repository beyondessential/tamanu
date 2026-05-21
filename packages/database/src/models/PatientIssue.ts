import { DataTypes } from 'sequelize';

import { PATIENT_ISSUE_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { dateTimeType, type InitOptions, type Models } from '../types/model';
import { Model } from './Model';
import type { Patient } from './Patient';

const PATIENT_ISSUE_TYPE_VALUES = Object.values(PATIENT_ISSUE_TYPES);
export class PatientIssue extends Model {
  declare id: string;
  declare note?: string;
  declare patientId: Patient['id'];
  declare recordedDate: string;
  declare type: (typeof PATIENT_ISSUE_TYPE_VALUES)[number];

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

  static async buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
