import React, { useEffect, useState } from 'react';

import { InvoiceInsuranceModal } from './InvoiceInsuranceModal';
import { InvoicePatientDetailsModal } from './InvoicePatientDetailsModal';
import { usePatientAvailableInsurancePlansQuery } from '../../api/queries';
import { useInvoicePatientDetailsAccess } from './useInvoicePatientDetailsAccess';
import { notifyError } from '../../utils';
import { TranslatedText } from '../../components/Translation';

/**
 * Where the flow begins.
 *
 * `picker` is the invoice's Insurance plan action, which always opens the plan picker and reaches
 * the patient's details through the picker's own empty state. `auto` is Add insurance plan on
 * Record payment, which goes wherever the patient's plans say: the picker where this facility has
 * one to bill against, and the patient's details where it does not.
 */
export const INSURANCE_PLAN_ENTRY = {
  PICKER: 'picker',
  AUTO: 'auto',
};

const STEPS = {
  PICKER: 'picker',
  PATIENT_DETAILS: 'patientDetails',
};

/**
 * Putting an insurance plan on an invoice, from either of the places that offer it. A plan has to be
 * recorded on the patient before it can be chosen for the invoice, so the two windows run on from
 * one another.
 *
 * The flow owns which window opens when, so no caller repeats the rule, and it asks the server for
 * the patient's available plans only while it is open.
 */
export const InsurancePlanFlow = ({
  invoice,
  open,
  entry = INSURANCE_PLAN_ENTRY.PICKER,
  onClose,
  onApplied = () => {},
}) => {
  const { canRecordPlanOnPatient, isPatientDetailsEditable } =
    useInvoicePatientDetailsAccess(invoice);
  const [step, setStep] = useState(null);

  const { data: availablePlans = [], refetch: refetchAvailablePlans } =
    usePatientAvailableInsurancePlansQuery({
      patientId: invoice?.encounter?.patientId,
      enabled: open,
    });

  // The entry point decides the first window, once, as the flow opens.
  useEffect(() => {
    if (!open) {
      setStep(null);
      return;
    }
    setStep(currentStep => {
      if (currentStep) return currentStep;
      if (entry === INSURANCE_PLAN_ENTRY.PICKER) return STEPS.PICKER;
      if (availablePlans.length === 0 && canRecordPlanOnPatient) return STEPS.PATIENT_DETAILS;
      return STEPS.PICKER;
    });
  }, [open, entry, availablePlans.length, canRecordPlanOnPatient]);

  // Read the plans back rather than the render's copy: the save that just landed is what may have
  // added one, so the question being asked is whether it did.
  const handlePatientDetailsSaved = async () => {
    let plans;
    try {
      ({ data: plans } = await refetchAvailablePlans());
    } catch (error) {
      // The plan may well have saved, so end on the picker rather than on the invoice: it asks the
      // server again itself, and shows its own empty state if there is still nothing to choose.
      notifyError(
        <TranslatedText
          stringId="invoice.error.insurancePlansUnavailable"
          fallback="Could not check the patient's insurance plans. Select their plan for this invoice below."
        />,
      );
      setStep(STEPS.PICKER);
      return;
    }

    if (plans?.length) {
      setStep(STEPS.PICKER);
      return;
    }
    onClose();
  };

  return (
    <>
      {step === STEPS.PICKER && (
        <InvoiceInsuranceModal
          open
          invoice={invoice}
          onClose={onClose}
          onSaved={onApplied}
          onAddToPatient={canRecordPlanOnPatient ? () => setStep(STEPS.PATIENT_DETAILS) : undefined}
        />
      )}
      {step === STEPS.PATIENT_DETAILS && (
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
