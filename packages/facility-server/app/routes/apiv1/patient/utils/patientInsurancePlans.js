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

export const savePatientInsurancePlans = async (PatientInvoiceInsurancePlanModel, patientId, invoiceInsurancePlanIds) => {
  if (invoiceInsurancePlanIds == null) {
    return;
  }

  const existingPlans = await PatientInvoiceInsurancePlanModel.findAll({
    where: { patientId },
  });

  const desiredPlanIds = new Set(invoiceInsurancePlanIds);
  const activePlanIds = new Set(existingPlans.map(plan => plan.invoiceInsurancePlanId));

  const toCreate = invoiceInsurancePlanIds.filter(id => !activePlanIds.has(id));
  const toDelete = [...activePlanIds].filter(id => !desiredPlanIds.has(id));

  const promises = [];
  if (toCreate.length > 0) {
    promises.push(PatientInvoiceInsurancePlanModel.bulkCreate(
      toCreate.map(id => ({ patientId, invoiceInsurancePlanId: id }))
    ));
  }

  if (toDelete.length > 0) {
    promises.push(PatientInvoiceInsurancePlanModel.destroy({
      where: { patientId, invoiceInsurancePlanId: { [Op.in]: toDelete } },
    }));
  }

  await Promise.all(promises);
};
