import { Sequelize } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientLinkedSyncFilter } from './buildPatientLinkedSyncFilter';
import { dateTimeType } from './dateTimeTypes';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

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
        resolutionDate: dateTimeType('resolutionDate', {
          defaultValue: getCurrentDateTimeString,
          allowNull: true,
        }),
        resolutionNote: Sequelize.TEXT,
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
    this.belongsTo(models.ReferenceData, { foreignKey: 'conditionId', as: 'condition' });
    this.belongsTo(models.User, { foreignKey: 'examinerId' });
    this.belongsTo(models.User, { foreignKey: 'resolutionPractitionerId' });
  }

  static getListReferenceAssociations() {
    return ['condition'];
  }

  static buildSyncFilter = buildPatientLinkedSyncFilter;
}
