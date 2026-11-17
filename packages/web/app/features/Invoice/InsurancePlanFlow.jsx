import React, { useState } from 'react';
import { BaseModal } from '@tamanu/ui-components';

import { InvoiceInsuranceModal } from './InvoiceInsuranceModal';
import { InvoicePatientDetailsModal } from './InvoicePatientDetailsModal';
import { usePatientAvailableInsurancePlansQuery } from '../../api/queries';
import { useInvoicePatientDetailsAccess } from './useInvoicePatientDetailsAccess';
import { LoadingIndicator } from '../../components/LoadingIndicator';
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
  section,
  entry = INSURANCE_PLAN_ENTRY.PICKER,
  onClose,
  onApplied = () => {},
}) => {
  const { canRecordPlanOnPatient, isPatientDetailsEditable } =
    useInvoicePatientDetailsAccess(invoice);
  const [step, setStep] = useState(null);
  const [wasOpen, setWasOpen] = useState(open);

  const {
    data: availablePlans,
    isError: hasPlansError,
    isFetching: isFetchingPlans,
    refetch: refetchAvailablePlans,
  } = usePatientAvailableInsurancePlansQuery({
    patientId: invoice?.encounter?.patientId,
    enabled: open,
  });

  // The flow starts at its first window each time it opens, rather than wherever it last left off.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setStep(null);
  }

  // Add insurance plan routes on what the patient already has, so the answer has to be in before
  // the first window is chosen, and it has to be current: react-query serves a cached answer while
  // a refetch is in flight, and a patient may have gained a plan since it was cached. The
  // Insurance plan action always opens the picker, so it waits on nothing.
  const plansAnswered = hasPlansError || (availablePlans !== undefined && !isFetchingPlans);
  const chooseFirstStep = () => {
    if (entry === INSURANCE_PLAN_ENTRY.PICKER) return STEPS.PICKER;
    if (!plansAnswered) return null;
    // A failed query falls back to the picker, which reports the failure itself.
    const hasPlanAtThisFacility = Boolean(availablePlans?.length) || hasPlansError;
    return !hasPlanAtThisFacility && canRecordPlanOnPatient
      ? STEPS.PATIENT_DETAILS
      : STEPS.PICKER;
  };
  // Latch the first window once it is chosen. The picker reads the same plans query, and mounting
  // it refetches them; left unlatched, that refetch would send the flow back to loading, unmount
  // the picker, and remount it into another refetch, over and over.
  const firstStep = open && step === null ? chooseFirstStep() : null;
  if (firstStep) setStep(firstStep);
  const currentStep = step ?? firstStep;

  // Read the plans back rather than the render's copy: the save that just landed is what may have
  // added one, so the question being asked is whether it did.
  const handlePatientDetailsSaved = async () => {
    let plans;
    try {
      ({ data: plans } = await refetchAvailablePlans());
    } catch (error) {
      // The plan may well have saved, so end on the picker rather than on the invoice: it asks the
      // server again itself, and says so in its own right if it cannot get an answer either.
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

  if (!open) return null;

  // Which window opens is not known until the patient's plans are in, and the window the user came
  // from has already closed, so stand in for it rather than leaving them looking at the invoice.
  if (!currentStep) {
    return (
      <BaseModal open width="sm" onClose={onClose}>
        <LoadingIndicator />
      </BaseModal>
    );
  }

  return (
    <>
      {currentStep === STEPS.PICKER && (
        <InvoiceInsuranceModal
          open
          invoice={invoice}
          section={section}
          onClose={onClose}
          onSaved={onApplied}
          onAddToPatient={canRecordPlanOnPatient ? () => setStep(STEPS.PATIENT_DETAILS) : undefined}
        />
      )}
      {currentStep === STEPS.PATIENT_DETAILS && (
        <InvoicePatientDetailsModal
          open
          patientId={invoice?.encounter?.patientId}
          editable={isPatientDetailsEditable}
          focusField="invoiceInsurancePlanId"
          onClose={onClose}
          onSaved={handlePatientDetailsSaved}
        />
      )}
    </>
  );
};
