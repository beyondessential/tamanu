import { DataTypes } from 'sequelize';
import { SYNC_DIRECTIONS } from '@tamanu/constants';
import { generateDisplayId } from '@tamanu/utils/generateDisplayId';
import { Model } from './Model';
import type { InitOptions, Models } from '../types/model';
import type { MedicationDispense } from './MedicationDispense';
import type { PharmacyOrder } from './PharmacyOrder';
import {
  buildEncounterPatientIdSelect,
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../sync';

export class PharmacyOrderPrescription extends Model {
  declare id: string;
  declare pharmacyOrderId: string;
  declare prescriptionId: string;
  declare sourcePrescriptionId?: string | null;
  declare displayId: string;
  declare quantity?: number;
  declare repeats?: number;
  declare isCompleted: boolean;
  declare medicationDispenses?: MedicationDispense[];
  declare pharmacyOrder?: PharmacyOrder;

  static initModel({ primaryKey, ...options }: InitOptions, models: Models) {
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
        isCompleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: {
          async afterDestroy(pharmacyOrderPrescription: PharmacyOrderPrescription, opts) {
            const pharmacyOrder = await models.PharmacyOrder.findByPk(
              pharmacyOrderPrescription.pharmacyOrderId,
              {
                include: [
                  {
                    association: 'pharmacyOrderPrescriptions',
                  },
                ],
                transaction: opts.transaction,
              },
            );
            if (
              pharmacyOrder &&
              (!pharmacyOrder?.pharmacyOrderPrescriptions ||
                !pharmacyOrder?.pharmacyOrderPrescriptions.length)
            ) {
              await pharmacyOrder.destroy({ transaction: opts.transaction });
            }
          },
        },
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

    this.belongsTo(models.Prescription, {
      foreignKey: 'sourcePrescriptionId',
      as: 'sourcePrescription',
    });

    this.hasMany(models.MedicationDispense, {
      foreignKey: 'pharmacyOrderPrescriptionId',
      as: 'medicationDispenses',
    });
  }

  getRemainingRepeats(extraDispenses: number = 0): number {
    // No repeats will be consumed by an INPATIENT medication request.
    if (!this.pharmacyOrder?.isDischargePrescription) {
      return 0;
    }
    // The remaining repeats for OUTPATIENT medication requests is the number of repeats minus the number of dispenses.
    const repeats = this.repeats || 0;
    const dispenseCount = (this.medicationDispenses || []).length + extraDispenses;
    // we subtract 1 from the dispense count because the first dispense is not counted as a repeat
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
