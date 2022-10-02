import { Sequelize } from 'sequelize';
import { initSyncForModelNestedUnderPatient } from './sync';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';

export class PatientCarePlan extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        date: dateTimeType('date', {
          defaultValue: getCurrentDateTimeString,
          allowNull: false,
        }),
      },
      {
        ...options,
        syncConfig: {
          ...initSyncForModelNestedUnderPatient(this, 'carePlan'),
          includedRelations: ['notePages', 'notePages.noteItems'],
        },
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'carePlanId', as: 'carePlan' });
    this.belongsTo(models.User, { foreignKey: 'examinerId', as: 'examiner' });

    this.hasMany(models.NotePage, {
      foreignKey: 'recordId',
      as: 'notePages',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });
  }

  static getListReferenceAssociations() {
    return ['carePlan', 'examiner'];
  }
}
