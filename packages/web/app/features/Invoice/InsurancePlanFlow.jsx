import React from 'react';

import { InvoiceInsuranceModal } from './InvoiceInsuranceModal';
import { InvoicePatientDetailsModal } from './InvoicePatientDetailsModal';
import { usePatientAvailableInsurancePlansQuery } from '../../api/queries';
import { useInvoicePatientDetailsAccess } from './useInvoicePatientDetailsAccess';

export const INSURANCE_PLAN_STEPS = {
  PICKER: 'picker',
  PATIENT_DETAILS: 'patientDetails',
};

/**
 * Putting an insurance plan on an invoice, from either of the places that offer it. A plan has to be
 * recorded on the patient before it can be chosen for the invoice, so the two windows run on from
 * one another: the picker where the patient already has a plan this facility can bill against, and
 * the patient's details first where they do not.
 *
 * The caller owns `step`, so it can start the flow wherever it needs to and knows when it ends.
 */
export const InsurancePlanFlow = ({ invoice, step, setStep, onClose, onApplied = () => {} }) => {
  const { canAddPlanToPatient, isPatientDetailsEditable } = useInvoicePatientDetailsAccess(invoice);
  const { refetch: refetchAvailablePlans } = usePatientAvailableInsurancePlansQuery({
    patientId: invoice?.encounter?.patientId,
  });

  // Read the plans back rather than the render's copy: the save that just landed is what may have
  // added one, so the question being asked is whether it did.
  const handlePatientDetailsSaved = async () => {
    const { data: availablePlans } = await refetchAvailablePlans();
    if (availablePlans?.length) {
      setStep(INSURANCE_PLAN_STEPS.PICKER);
      return;
    }
    onClose();
  };

  return (
    <>
      {step === INSURANCE_PLAN_STEPS.PICKER && (
        <InvoiceInsuranceModal
          open
          invoice={invoice}
          onClose={onClose}
          onSaved={onApplied}
          onAddToPatient={
            canAddPlanToPatient
              ? () => setStep(INSURANCE_PLAN_STEPS.PATIENT_DETAILS)
              : undefined
          }
        />
      )}
      {step === INSURANCE_PLAN_STEPS.PATIENT_DETAILS && (
        <InvoicePatientDetailsModal
          open
          editable={isPatientDetailsEditable}
          focusField="invoiceInsurancePlanId"
          onClose={onClose}
          onSaved={handlePatientDetailsSaved}
        />
      )}
    </>
  );
};
