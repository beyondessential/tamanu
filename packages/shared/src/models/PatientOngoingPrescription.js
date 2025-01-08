import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import { buildPatientSyncFilterViaPatientId } from './buildPatientSyncFilterViaPatientId';
import { buildPatientLinkedLookupFilter } from './buildPatientLinkedLookupFilter';

export class PatientOngoingPrescription extends Model {
  static init({ primaryKey, ...options }) {
    super.init(
      {
        id: primaryKey,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models) {
    this.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient',
    });
    this.belongsTo(models.Prescription, {
      foreignKey: 'prescriptionId',
      as: 'prescription',
    });
  }

  static buildSyncLookupQueryDetails() {
    return buildPatientLinkedLookupFilter(this);
  }

  static buildPatientSyncFilter = buildPatientSyncFilterViaPatientId;
}
