import { Sequelize } from 'sequelize';
import { initSyncForModelNestedUnderPatient } from './sync';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

export class PatientCondition extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: dateTimeType('recordedDate', {
          defaultValue: getCurrentDateTimeString,
          allowNull: false,
        }),
        resolved: { type: Sequelize.BOOLEAN, defaultValue: false },
      },
      {
        ...options,
        syncConfig: initSyncForModelNestedUnderPatient(this, 'condition'),
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'conditionId', as: 'condition' });
    this.belongsTo(models.User, { foreignKey: 'examinerId' });
  }

  static getListReferenceAssociations() {
    return ['condition'];
  }
}
