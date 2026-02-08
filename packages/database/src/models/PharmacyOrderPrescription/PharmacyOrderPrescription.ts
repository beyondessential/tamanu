import { DataTypes, Op } from 'sequelize';
import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICEABLE_MEDICATION_ENCOUNTER_TYPES,
  SYNC_DIRECTIONS,
} from '@tamanu/constants';
import { generateDisplayId } from '@tamanu/utils/generateDisplayId';
import { Model } from '../Model';
import type { InitOptions, Models } from '../../types/model';
import type { MedicationDispense } from '../MedicationDispense';
import type { PharmacyOrder } from '../PharmacyOrder';
import {
  buildEncounterPatientIdSelect,
  buildEncounterLinkedSyncFilter,
  buildEncounterLinkedSyncFilterJoins,
} from '../../sync';
import { afterDestroyHook } from './hooks';

export class PharmacyOrderPrescription extends Model {
  declare id: string;
  declare pharmacyOrderId: string;
  declare prescriptionId: string;
  declare displayId: string;
  declare quantity?: number;
  declare repeats?: number;
  declare isCompleted: boolean;
  declare medicationDispenses?: MedicationDispense[];
  declare pharmacyOrder?: PharmacyOrder;

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
        isCompleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        ...options,
        syncDirection: SYNC_DIRECTIONS.BIDIRECTIONAL,
        hooks: { afterDestroy: afterDestroyHook },
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

  // Recalculate invoice quantity:
  // finalQty = (sum of MAR Given doses up to earliest pharmacy order date) + (sum of pharmacy order quantities)
  static async updateInvoiceQuantityForPrescription(
    pop: PharmacyOrderPrescription,
    models: Models,
  ) {
    const {
      Prescription,
      EncounterPrescription,
      Encounter,
      InvoiceProduct,
      Invoice,
      MedicationAdministrationRecord,
      MedicationAdministrationRecordDose,
      PharmacyOrderPrescription,
      PharmacyOrder,
    } = models;

    // Load prescription with encounter
    const prescription = await Prescription.findByPk(pop.prescriptionId, {
      include: [
        {
          model: EncounterPrescription,
          as: 'encounterPrescription',
          required: true,
          include: [{ model: Encounter, as: 'encounter', required: true }],
        },
      ],
    });
    const encounter = prescription?.encounterPrescription?.encounter;
    if (!encounter) return;
    if (!INVOICEABLE_MEDICATION_ENCOUNTER_TYPES.includes(encounter.encounterType || '')) return;

    // Product for this drug
    const invoiceProduct = await InvoiceProduct.findOne({
      where: {
        category: INVOICE_ITEMS_CATEGORIES.DRUG,
        sourceRecordId: prescription.medicationId,
      },
    });
    if (!invoiceProduct) return;

    // All pharmacy orders for this prescription
    const pops = await PharmacyOrderPrescription.findAll({
      where: { prescriptionId: prescription.id },
      include: [
        { model: PharmacyOrder, as: 'pharmacyOrder', attributes: ['date', 'orderingClinicianId'] },
      ],
    });

    const hasPharmacy = pops.length > 0;
    const earliestPharmacyDate = hasPharmacy
      ? new Date(
          pops
            .map(p => new Date(p?.pharmacyOrder?.date as unknown as string))
            .sort((a, b) => a.getTime() - b.getTime())[0]!,
        )
      : undefined;
    const totalSentQty = pops.reduce((sum: number, p: any) => sum + (Number(p.quantity) || 0), 0);

    // Sum MAR Given up to earliest pharmacy order date (or all if none sent)
    let marQty = 0;
    const givenMars = await MedicationAdministrationRecord.findAll({
      where: { prescriptionId: prescription.id, status: 'given' },
      attributes: ['id'],
    });
    if (givenMars.length > 0) {
      const marIds = givenMars.map((m: any) => m.id);
      const doses = await MedicationAdministrationRecordDose.findAll({
        where: {
          marId: { [Op.in]: marIds },
          isRemoved: { [Op.ne]: true },
          ...(earliestPharmacyDate
            ? {
                givenTime: { [Op.lte]: earliestPharmacyDate },
              }
            : {}),
        },
        attributes: ['doseAmount'],
      });
      marQty = doses.reduce((sum: number, d: any) => sum + Number(d.doseAmount || 0), 0);
    }

    const finalQty = marQty + totalSentQty;

    if (finalQty > 0) {
      await Invoice.setItemQuantityForInvoice(
        prescription,
        encounter.id,
        invoiceProduct,
        finalQty,
        // Prefer the clinician who ordered the POP if available, else leave unset
        pops[0]?.pharmacyOrder?.orderingClinicianId,
      );
    } else {
      await Invoice.removeItemFromInvoice(prescription, encounter.id);
    }
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
