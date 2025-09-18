import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import { buildEncounterLinkedLookupFilter, buildEncounterLinkedSyncFilter } from '../sync';

export class PharmacyOrder extends Model {
  declare id: string;
  declare orderingClinicianId: string;
  declare encounterId: string;
  declare comments?: string;
  declare isDischargePrescription: boolean;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        comments: DataTypes.TEXT,
        isDischargePrescription: DataTypes.BOOLEAN,
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.User, {
      foreignKey: 'orderingClinicianId',
      as: 'orderingClinician',
    });

    this.belongsTo(models.Encounter, {
      foreignKey: 'encounterId',
      as: 'encounter',
    });

    this.hasMany(models.PharmacyOrderPrescription, {
      foreignKey: 'pharmacyOrderId',
      as: 'pharmacyOrderPrescriptions',
    });
  }

  static getListReferenceAssociations() {
    return ['orderingClinician', 'encounter'];
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
