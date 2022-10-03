import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from 'shared/constants';
import { Model } from './Model';
import { buildPatientLinkedSyncFilter } from './buildPatientLinkedSyncFilter';
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
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
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

  static buildSyncFilter = buildPatientLinkedSyncFilter;
}
