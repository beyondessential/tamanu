import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { DataTypes } from 'sequelize';
import { Model } from './Model.ts';
import { buildEncounterLinkedSyncFilter } from '../sync/buildEncounterLinkedSyncFilter.ts';
import { buildEncounterLinkedLookupFilter } from '../sync/buildEncounterLinkedLookupFilter.ts';
import type { InitOptions, Models } from '../types/model.ts';
import type { Encounter } from './Encounter.ts';

export class EncounterPrescription extends Model {
  declare id: string;
  declare encounterId?: string;
  declare prescriptionId?: string;
  declare isSelectedForDischarge: boolean;

  declare encounter: Encounter;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        isSelectedForDischarge: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });
    this.belongsTo(models.Prescription, {
      foreignKey: 'prescriptionId',
      as: 'prescription',
    });
    this.hasMany(models.EncounterPausePrescription, {
      foreignKey: 'encounterPrescriptionId',
      as: 'pausePrescriptions',
    });
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return buildEncounterLinkedLookupFilter(this);
  }
}
