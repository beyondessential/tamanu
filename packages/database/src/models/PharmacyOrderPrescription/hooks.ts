import type { PharmacyOrderPrescription } from './PharmacyOrderPrescription';

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

export const afterDestroyHook = async (instance: PharmacyOrderPrescription) => {
  await destroyPharmacyOrder(instance);
};
