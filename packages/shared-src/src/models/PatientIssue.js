import { Sequelize } from 'sequelize';
import { PATIENT_ISSUE_TYPES } from '../constants';
import { initSyncForModelNestedUnderPatient } from './sync';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

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
        syncConfig: initSyncForModelNestedUnderPatient(this, 'issue'),
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
  }
}
