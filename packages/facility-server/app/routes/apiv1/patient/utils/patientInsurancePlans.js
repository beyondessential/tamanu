import { Op } from 'sequelize';

export const savePatientInsurancePlans = async (PatientInvoiceInsurancePlanModel, patientId, invoiceInsurancePlanIdString) => {
  if (invoiceInsurancePlanIdString) {
    let invoiceInsurancePlanIds = [];
    try {
      invoiceInsurancePlanIds = JSON.parse(invoiceInsurancePlanIdString);
    } catch (error) {
      console.error('Error parsing invoiceInsurancePlanId:', error);
      throw new Error(`Error parsing Invoice Insurance Plans: ${invoiceInsurancePlanIdString}`);
    }

    const existingInsurancePlans = await PatientInvoiceInsurancePlanModel.findAll({
      where: { patientId },
      paranoid: false,
    });

    const activeInsurancePlanIds = existingInsurancePlans.filter(plan => !plan.deletedAt).map(plan => plan.invoiceInsurancePlanId);
    const deletedInsurancePlanIds = existingInsurancePlans.filter(plan => Boolean(plan.deletedAt)).map(plan => plan.invoiceInsurancePlanId);

    const insurancePlanIdsToCreate = [];
    const insurancePlanIdsToRestore = [];
    for (const id of invoiceInsurancePlanIds) {
      if (!activeInsurancePlanIds.includes(id) && !deletedInsurancePlanIds.includes(id)) {
        // If the insurance plan is not active and not deleted, it is a completely new insurance plan that should be created.
        insurancePlanIdsToCreate.push(id);
      } else if (deletedInsurancePlanIds.includes(id)) {
        // If the insurance plan is deleted, it is a previously deleted insurance plan that should be restored.
        insurancePlanIdsToRestore.push(id);
      }
    }

    // If the insurance plan is active and not in the list of insurance plans to create or restore, it is a previously active insurance plan that should be deleted.
    const insurancePlanIdsToDelete = activeInsurancePlanIds.filter(id => !invoiceInsurancePlanIds.includes(id));

    if (insurancePlanIdsToCreate.length > 0) {
      await PatientInvoiceInsurancePlanModel.bulkCreate(
        insurancePlanIdsToCreate.map(id => ({ patientId, invoiceInsurancePlanId: id })),
      );
    }

    if (insurancePlanIdsToDelete.length > 0) {
      await PatientInvoiceInsurancePlanModel.destroy({
        where: { patientId, invoiceInsurancePlanId: { [Op.in]: insurancePlanIdsToDelete } },
      });
    }

    if (insurancePlanIdsToRestore.length > 0) {
      await PatientInvoiceInsurancePlanModel.restore({
        where: { patientId, invoiceInsurancePlanId: { [Op.in]: insurancePlanIdsToRestore } },
      });
    }
  }
};
