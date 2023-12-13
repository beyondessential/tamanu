import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Sequelize } from 'sequelize';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';
import { dateTimeType } from './dateTimeTypes';
import { Model } from './Model';
import { onSaveMarkPatientForSync } from './onSaveMarkPatientForSync';

export class PatientAllergy extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
        note: Sequelize.STRING,
        recordedDate: dateTimeType('recordedDate', {
          defaultValue: getCurrentDateTimeString,
          allowNull: false,
        }),
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
    this.belongsTo(models.User, { foreignKey: 'practitionerId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'allergyId', as: 'allergy' });
  }

  static getListReferenceAssociations() {
    return ['allergy'];
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
