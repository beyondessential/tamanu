import { Op } from 'sequelize';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
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

export const savePatientInsurancePlans = async (PatientInvoiceInsurancePlanModel, patientId, invoiceInsurancePlanIds) => {
  if (invoiceInsurancePlanIds == null) {
    return;
  }

  // Each (patient, plan) pair has exactly one row for its whole lifecycle, so removing a plan
  // marks the row historical and re-adding it marks it current, rather than soft-deleting and
  // restoring.
  const existingPlans = await PatientInvoiceInsurancePlanModel.findAll({
    where: { patientId },
  });
  const existingByPlanId = new Map(
    existingPlans.map(plan => [plan.invoiceInsurancePlanId, plan]),
  );
  const desiredPlanIds = new Set(invoiceInsurancePlanIds);

  const idsToCreate = invoiceInsurancePlanIds.filter(id => !existingByPlanId.has(id));
  const idsToMakeCurrent = existingPlans
    .filter(
      plan =>
        desiredPlanIds.has(plan.invoiceInsurancePlanId) &&
        plan.visibilityStatus !== VISIBILITY_STATUSES.CURRENT,
    )
    .map(plan => plan.invoiceInsurancePlanId);
  const idsToMakeHistorical = existingPlans
    .filter(
      plan =>
        !desiredPlanIds.has(plan.invoiceInsurancePlanId) &&
        plan.visibilityStatus !== VISIBILITY_STATUSES.HISTORICAL,
    )
    .map(plan => plan.invoiceInsurancePlanId);

  const promises = [];
  if (idsToCreate.length > 0) {
    promises.push(PatientInvoiceInsurancePlanModel.bulkCreate(
      idsToCreate.map(id => ({ patientId, invoiceInsurancePlanId: id }))
    ));
  }

  if (idsToMakeCurrent.length > 0) {
    promises.push(PatientInvoiceInsurancePlanModel.update(
      { visibilityStatus: VISIBILITY_STATUSES.CURRENT },
      { where: { patientId, invoiceInsurancePlanId: { [Op.in]: idsToMakeCurrent } } },
    ));
  }

  if (idsToMakeHistorical.length > 0) {
    promises.push(PatientInvoiceInsurancePlanModel.update(
      { visibilityStatus: VISIBILITY_STATUSES.HISTORICAL },
      { where: { patientId, invoiceInsurancePlanId: { [Op.in]: idsToMakeHistorical } } },
    ));
  }

  await Promise.all(promises);
};
