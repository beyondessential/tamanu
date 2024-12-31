import { Sequelize } from 'sequelize';
import { PATIENT_ISSUE_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from '../sync/buildPatientSyncFilterViaPatientId';
import { dateTimeType } from '../types/model';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { buildPatientLinkedLookupFilter } from '../sync/buildPatientLinkedLookupFilter';

export class PatientIssue extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: dateTimeType('recordedDate', {
          defaultValue: getCurrentDateTimeString,
          allowNull: false,
        }),
        type: {
          type: Sequelize.ENUM(Object.values(PATIENT_ISSUE_TYPES)),
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

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
  }

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
