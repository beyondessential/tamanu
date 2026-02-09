import type { PharmacyOrderPrescription } from './PharmacyOrderPrescription';

// Recalculate invoice quantity:
// finalQty = (sum of MAR Given doses up to earliest pharmacy order date) + (sum of pharmacy order quantities)
const updateInvoiceQuantityForPrescription = async (instance: PharmacyOrderPrescription) => {
  const { models } = instance.sequelize;
  const prescription = await models.Prescription.findByPk(instance.prescriptionId, {
    include: [
      {
        model: models.EncounterPrescription,
        as: 'encounterPrescription',
        required: true,
        include: [{ model: models.Encounter, as: 'encounter', required: true }],
      },
    ],
  });
  if (prescription) {
    await prescription.recalculateAndApplyInvoiceQuantity();
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
  await destroyPharmacyOrder(instance);
};
