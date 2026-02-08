import { Op } from 'sequelize';
import {
  INVOICE_ITEMS_CATEGORIES,
  INVOICEABLE_MEDICATION_ENCOUNTER_TYPES,
} from '@tamanu/constants';
import type { PharmacyOrderPrescription } from './PharmacyOrderPrescription';

// Recalculate invoice quantity:
// finalQty = (sum of MAR Given doses up to earliest pharmacy order date) + (sum of pharmacy order quantities)
export const updateInvoiceQuantityForPrescription = async (instance: PharmacyOrderPrescription) => {
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
  } = instance.sequelize.models;

  // Load prescription with encounter
  const prescription = await Prescription.findByPk(instance.prescriptionId, {
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
};

const destroyPharmacyOrder = async (instance: PharmacyOrderPrescription) => {
  const pharmacyOrder = await instance.sequelize.models.PharmacyOrder.findByPk(
    instance.pharmacyOrderId,
    {
      include: [
        {
          association: 'pharmacyOrderPrescriptions',
        },
      ],
    },
  );
  if (
    pharmacyOrder &&
    (!pharmacyOrder?.pharmacyOrderPrescriptions ||
      !pharmacyOrder?.pharmacyOrderPrescriptions.length)
  ) {
    await pharmacyOrder.destroy();
  }
};

export const afterCreateHook = async (instance: PharmacyOrderPrescription) => {
  await updateInvoiceQuantityForPrescription(instance);
};

export const afterUpdateHook = async (instance: PharmacyOrderPrescription) => {
  await updateInvoiceQuantityForPrescription(instance);
};

export const afterDestroyHook = async (instance: PharmacyOrderPrescription) => {
  await Promise.all([destroyPharmacyOrder(instance)]);
};
