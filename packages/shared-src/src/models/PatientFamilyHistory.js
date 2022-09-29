import { Sequelize } from 'sequelize';
import { initSyncForModelNestedUnderPatient } from './sync';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

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
        syncConfig: initSyncForModelNestedUnderPatient(this, 'familyHistory'),
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId', as: 'patient' });
    this.belongsTo(models.User, { foreignKey: 'practitionerId', as: 'practitioner' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'diagnosisId', as: 'diagnosis' });
  }

  static getListReferenceAssociations() {
    return ['diagnosis'];
  }
}
