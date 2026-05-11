import { Op } from 'sequelize';
import { InvalidParameterError } from '@tamanu/errors';

export const parseInvoiceInsurancePlanIds = (rawInsurancePlanIds) => {
  try {
    if (Array.isArray(rawInsurancePlanIds)) {
      return rawInsurancePlanIds;
    }
    if (rawInsurancePlanIds) {
      return JSON.parse(rawInsurancePlanIds);
    }
  } catch (error) {
    throw new InvalidParameterError('Invalid insurance plan id');
  }
  return undefined;
};

export const savePatientInsurancePlans = async (
  PatientInvoiceInsurancePlanModel,
  patientId,
  invoiceInsurancePlanIds,
) => {
  if (invoiceInsurancePlanIds == null) {
    return;
  }

  const desiredInvoiceInsurancePlanIds = [...new Set(invoiceInsurancePlanIds)];
  const desiredPlanIds = new Set(desiredInvoiceInsurancePlanIds);
  const existingPlans = await PatientInvoiceInsurancePlanModel.findAll({
    where: { patientId },
    paranoid: false,
    order: [['createdAt', 'ASC']],
  });

  const activePlanIds = new Set(
    existingPlans
      .filter(plan => !plan.deletedAt)
      .map(plan => plan.invoiceInsurancePlanId),
  );

  const firstDeletedPlanByPlanId = existingPlans
    .filter(plan => plan.deletedAt && desiredPlanIds.has(plan.invoiceInsurancePlanId))
    .reduce((deletedPlans, plan) => {
      if (!deletedPlans.has(plan.invoiceInsurancePlanId)) {
        deletedPlans.set(plan.invoiceInsurancePlanId, plan);
      }
      return deletedPlans;
    }, new Map());

  const planIdsToDelete = [...activePlanIds].filter(planId => !desiredPlanIds.has(planId));
  const planIdsToRestore = desiredInvoiceInsurancePlanIds
    .filter(planId => !activePlanIds.has(planId) && firstDeletedPlanByPlanId.has(planId))
    .map(planId => firstDeletedPlanByPlanId.get(planId).id);
  const planIdsToCreate = desiredInvoiceInsurancePlanIds.filter(
    planId => !activePlanIds.has(planId) && !firstDeletedPlanByPlanId.has(planId),
  );

  if (planIdsToDelete.length > 0) {
    await PatientInvoiceInsurancePlanModel.destroy({
      where: { patientId, invoiceInsurancePlanId: { [Op.in]: planIdsToDelete } },
    });
  }

  if (planIdsToRestore.length > 0) {
    await PatientInvoiceInsurancePlanModel.restore({
      where: { id: { [Op.in]: planIdsToRestore } },
    });
  }

  if (planIdsToCreate.length > 0) {
    await PatientInvoiceInsurancePlanModel.bulkCreate(
      planIdsToCreate.map(invoiceInsurancePlanId => ({ patientId, invoiceInsurancePlanId })),
    );
  }
};
