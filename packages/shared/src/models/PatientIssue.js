import { PATIENT_ISSUE_TYPES, SYNC_DIRECTIONS } from '@tamanu/constants';
import { Sequelize } from 'sequelize';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';
import { dateTimeType } from './dateTimeTypes';
import { Model } from './Model';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

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
    onSaveMarkPatientForSync(this);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
