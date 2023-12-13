import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Sequelize } from 'sequelize';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';
import { dateTimeType } from './dateTimeTypes';
import { Model } from './Model';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

export class PatientFamilyHistory extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: dateTimeType('recordedDate', {
          defaultValue: getCurrentDateTimeString,
          allowNull: false,
        }),
        relationship: Sequelize.STRING,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
    onSaveMarkPatientForSync(this);
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    this.belongsTo(models.User, { foreignKey: 'practitionerId', as: 'practitioner' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'diagnosisId', as: 'diagnosis' });
  }

  static getListReferenceAssociations() {
    return ['diagnosis'];
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
