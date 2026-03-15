import { type DestroyOptions, type UpdateOptions } from 'sequelize';
import { PharmacyOrderPrescription } from './PharmacyOrderPrescription';

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
  await updateInvoiceQuantityForPrescription(instance);
  await destroyPharmacyOrder(instance);
};

export const afterBulkCreateHook = async (instances: PharmacyOrderPrescription[]) => {
  for (const instance of instances) {
    await updateInvoiceQuantityForPrescription(instance);
  }
};

export const afterBulkUpdateHook = async (options: UpdateOptions) => {
  const { where } = options;
  const instances = await PharmacyOrderPrescription.findAll({
    where,
  });
  for (const instance of instances) {
    await updateInvoiceQuantityForPrescription(instance as PharmacyOrderPrescription);
  }
};

export const afterBulkDestroyHook = async (options: DestroyOptions) => {
  const { where } = options;
  const instances = await PharmacyOrderPrescription.findAll({
    where,
    paranoid: false, // include deleted records to find what was just destroyed
  });
  for (const instance of instances) {
    await updateInvoiceQuantityForPrescription(instance as PharmacyOrderPrescription);
  }
};
