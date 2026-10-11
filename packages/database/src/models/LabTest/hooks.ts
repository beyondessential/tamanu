import { addLabRequestToInvoice, shouldAddLabRequestToInvoice } from '../LabRequest/hooks';
import type { LabTest } from './LabTest';

// A test's creation can complete a lab request's billable set (it is created after its request and,
// for panel members, after its panel request). Re-resolve the whole request through the shared
// resolver so coverage and per-type dedup are decided in one place; the upsert is idempotent.
const addToInvoiceAfterCreateHook = async (instance: LabTest) => {
  const { LabRequest } = instance.sequelize.models;
  const labRequest = await LabRequest.findByPk(instance.labRequestId);
  if (!labRequest || !labRequest.encounterId) {
    return;
  }
  if (!(await shouldAddLabRequestToInvoice(labRequest))) {
    return;
  }
  await addLabRequestToInvoice(labRequest);
};

export const afterCreateHook = async (instance: LabTest) => {
  await addToInvoiceAfterCreateHook(instance);
};
