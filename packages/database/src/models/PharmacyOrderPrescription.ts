import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { generateDisplayId } from '@tamanu/utils/generateDisplayId';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { MedicationDispense } from './MedicationDispense';
import {
  buildEncounterPatientIdSelect,
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync';

export class PharmacyOrderPrescription extends Model {
  declare id: string;
  declare pharmacyOrderId: string;
  declare prescriptionId: string;
  declare displayId: string;
  declare quantity?: number;
  declare repeats?: number;
  declare medicationDispenses?: MedicationDispense[];

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        displayId: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue() {
            return generateDisplayId();
          },
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        repeats: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
      },
    );
  }

  static initRelations(models: Models) {
    this.belongsTo(models.PharmacyOrder, {
      foreignKey: 'pharmacyOrderId',
      as: 'pharmacyOrder',
    });

    this.belongsTo(models.Prescription, {
      foreignKey: 'prescriptionId',
      as: 'prescription',
    });

    this.hasMany(models.MedicationDispense, {
      foreignKey: 'pharmacyOrderPrescriptionId',
      as: 'medicationDispenses',
    });
  }

  get remainingRepeats(): number {
    const repeats = this.repeats || 0;
    const dispenseCount = (this.medicationDispenses || []).length;
    return Math.max(0, repeats - Math.max(0, dispenseCount - 1));
  }

  static getListReferenceAssociations() {
    return ['pharmacyOrder', 'prescription'];
  }

  static buildPatientSyncFilter(patientCount: number, markedForSyncPatientsTable: string) {
    if (patientCount === 0) {
      return null;
    }
    return buildEncounterLinkedSyncFilter(
      [this.tableName, 'pharmacy_orders', 'encounters'],
      markedForSyncPatientsTable,
    );
  }

  static async buildSyncLookupQueryDetails() {
    return {
      select: await buildEncounterPatientIdSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'pharmacy_orders', 'encounters']),
    };
  }
}
