import { isInvoiceEditable } from '@tamanu/utils/invoice';

import { useAuth } from '../../contexts/Auth';
import { useSettings } from '../../contexts/Settings';

/**
 * Who may see and do what with the patient's details from an invoice, and whether insurance plans
 * figure in this deployment at all. Shared by the invoice's actions, the patient details modal and
 * the payments table, so the three agree on what is offered.
 */
export const useInvoicePatientDetailsAccess = invoice => {
  const { ability } = useAuth();
  const { getSetting } = useSettings();

  const canWriteInvoice = ability.can('write', 'Invoice');
  const canEditPatient = ability.can('write', 'Patient');
  // The same read, write or create test the patient's Details tab applies.
  const canViewPatientDetails = ['read', 'write', 'create'].some(verb =>
    ability.can(verb, 'Patient'),
  );

  const isInsurancePlanFieldShown = !getSetting('fields.invoiceInsurancePlanId.hidden');
  const isEditable = Boolean(invoice) && isInvoiceEditable(invoice);

  return {
    canViewPatientDetails,
    isInsurancePlanFieldShown,
    // A settled invoice is a billing record, so its patient details are shown as they stand.
    isPatientDetailsEditable: isEditable && canEditPatient,
    // Offered only where it can actually end in a plan on this invoice: the invoice still open to
    // change, and the user able to record the plan on the patient and to apply it here.
    canAddPlanToPatient: isEditable && canWriteInvoice && canEditPatient && isInsurancePlanFieldShown,
  };
};
