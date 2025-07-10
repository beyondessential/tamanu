import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import {
  buildEncounterPatientIdSelect,
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync';

export class PharmacyOrderPrescription extends Model {
  declare id: string;
  declare pharmacyOrderId: string;
  declare prescriptionId: string;
  declare quantity?: number;
  declare repeats?: number;

  static initModel({ primaryKey, ...options }: InitOptions) {
    super.init(
      {
        id: primaryKey,
        pharmacyOrderId: {
          type: DataTypes.UUID,
          allowNull: false,
          field: 'pharmacy_order_id',
        },
        prescriptionId: {
          type: DataTypes.TEXT,
          allowNull: false,
          field: 'prescription_id',
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

  static buildSyncLookupQueryDetails() {
    return {
      select: buildEncounterPatientIdSelect(this),
      joins: buildEncounterLinkedSyncFilterJoins([this.tableName, 'pharmacy_orders', 'encounters']),
    };
  }
}
