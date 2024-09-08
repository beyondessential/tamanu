import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { dateTimeType } from './dateTimeTypes';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { buildPatientLinkedLookupFilter } from './buildPatientLinkedLookupFilter';

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
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, { foreignKey: 'patientId' });
    this.belongsTo(models.ReferenceData, { foreignKey: 'carePlanId', as: 'carePlan' });
    this.belongsTo(models.User, { foreignKey: 'examinerId', as: 'examiner' });

    this.hasMany(models.Note, {
      foreignKey: 'recordId',
      as: 'notes',
      constraints: false,
      scope: {
        recordType: this.name,
      },
    });
  }

  static getListReferenceAssociations() {
    return ['carePlan', 'examiner'];
  }

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
