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
    canWriteInvoice,
    isInsurancePlanFieldShown,
    // A settled invoice is a billing record, so its patient details are shown as they stand.
    isPatientDetailsEditable: isEditable && canEditPatient,
    // Choosing which of the patient's plans apply is an invoice-only act, so it asks only what the
    // spec asks: an invoice still open to change, and a user who can change it. Named for the
    // invoice rather than the patient, since the two flags differ in exactly that.
    canAddInsurancePlanToInvoice: isEditable && canWriteInvoice && isInsurancePlanFieldShown,
    // Recording a new plan against the patient is the one leg of that flow which writes to the
    // patient, so it alone also needs permission to edit patient records.
    canRecordPlanOnPatient:
      isEditable && canWriteInvoice && isInsurancePlanFieldShown && canEditPatient,
  };
};
