import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { useFormikContext } from 'formik';
import { route } from '@tamanu/api-client';

import {
  BaseModal,
  Button,
  ButtonRow,
  OutlinedButton,
  ReadOnlyFormProvider,
} from '@tamanu/ui-components';

import { useApi } from '../../api';
import {
  usePatientAdditionalDataQuery,
  usePatientBirthDataQuery,
  usePatientDataQuery,
  usePatientInsurancePlansQuery,
} from '../../api/queries';
import { useAuth } from '../../contexts/Auth';
import { Colors } from '../../constants';
import { ConfirmModal } from '../../components/ConfirmModal';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { NoteModalActionBlocker } from '../../components';
import { PatientDetailsForm } from '../../forms/PatientDetailsForm/PatientDetailsForm';
import { getPatientFieldTestId } from '../../forms/PatientDetailsForm/ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../../components/Translation';
import { invalidatePatientDataQueries, notifyError, notifySuccess } from '../../utils';

const BottomRow = styled.div`
  padding-block: 1rem 1.25rem;
  padding-inline: 32px;
  border-block-start: 1px solid ${Colors.outline};
  background-color: ${Colors.background};
`;

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 0;
`;

/**
 * Lifts the form's submit handler out of the render prop, so the modal's bottom row — which sits
 * outside the form element and so cannot submit it natively — can call it, and reports the form's
 * dirty and submitting state up for the buttons and the unsaved-changes prompt.
 */
const FormBridge = ({ submitForm, bridgeRef, onStateChange }) => {
  const { dirty, isSubmitting, resetForm, values } = useFormikContext();

  bridgeRef.current = { submitForm, resetForm: () => resetForm({ values }) };

  useEffect(() => {
    onStateChange({ dirty, isSubmitting });
  }, [dirty, isSubmitting, onStateChange]);

  return null;
};

/**
 * Brings a named field into view and focuses it once the form has rendered. Used to land on the
 * insurance plan field when the modal is opened to add a plan. Searched within the modal's own
 * content, since the same field is on the patient's Details tab behind it.
 */
const FOCUS_ATTEMPTS = 40;
const FOCUS_RETRY_MS = 50;

const useFocusField = (fieldName, isReady, containerRef) => {
  useEffect(() => {
    if (!fieldName || !isReady) return undefined;

    // The form fetches its own field definitions and values after the modal's queries settle, and
    // renders nothing but a loading indicator until they land, so the field is not there to be
    // found on the first look. Keep looking for a short while rather than silently giving up.
    let attemptsLeft = FOCUS_ATTEMPTS;
    let timer;

    const attempt = () => {
      const field = containerRef.current?.querySelector(
        `[data-testid^="${getPatientFieldTestId(fieldName)}"]`,
      );
      if (field) {
        field.scrollIntoView({ block: 'center', behavior: 'smooth' });
        field.querySelector('input, [tabindex]')?.focus();
        return;
      }
      attemptsLeft -= 1;
      if (attemptsLeft > 0) timer = setTimeout(attempt, FOCUS_RETRY_MS);
    };

    timer = setTimeout(attempt);
    return () => clearTimeout(timer);
  }, [fieldName, isReady, containerRef]);
};

/**
 * The patient's Details tab shown over an invoice, so billing details can be checked and corrected
 * without leaving the invoice. Editable only on an in-progress invoice and for users who can edit
 * patient records; otherwise every field is read-only and Close replaces Cancel and Save.
 */
export const InvoicePatientDetailsModal = ({
  open,
  onClose,
  patientId,
  editable,
  focusField,
  onSaved = () => {},
}) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId } = useAuth();

  const bridgeRef = useRef(null);
  const contentRef = useRef(null);
  const [formState, setFormState] = useState({ dirty: false, isSubmitting: false });
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false);

  const { data: patient, isLoading: isLoadingPatient } = usePatientDataQuery(patientId);
  const { data: additionalData, isLoading: isLoadingAdditionalData } =
    usePatientAdditionalDataQuery(patientId);
  const { data: birthData, isLoading: isLoadingBirthData } = usePatientBirthDataQuery(patientId);
  const { data: insurancePlans = [], isLoading: isLoadingInsurancePlans } =
    usePatientInsurancePlansQuery({ patientId });

  const isLoading =
    isLoadingPatient || isLoadingAdditionalData || isLoadingBirthData || isLoadingInsurancePlans;

  useFocusField(focusField, open && !isLoading, contentRef);

  const handleSubmit = async data => {
    try {
      await api.put(route('patient/:patientId', { patientId }), { ...data, facilityId });
    } catch (e) {
      notifyError(e.message);
      return;
    }

    // The edits are saved, so the form is no longer holding anything unsaved. Clear it before the
    // caller decides what comes next: it may keep the modal up while it checks, and closing it
    // then would otherwise offer to discard what has just been written.
    bridgeRef.current?.resetForm();

    await invalidatePatientDataQueries(queryClient, patientId);
    notifySuccess(
      <TranslatedText
        stringId="patient.details.notification.saveSuccess"
        fallback="Patient details successfully updated"
      />,
    );
    onSaved();
  };

  // Escape, the corner close button and Cancel all land here, so the unsaved-changes prompt covers
  // every way out of the modal.
  const handleRequestClose = useCallback(() => {
    if (formState.dirty) {
      setIsConfirmingDiscard(true);
      return;
    }
    onClose();
  }, [formState.dirty, onClose]);

  // The handler rejects when validation fails, having already put the messages on the fields.
  // Nothing is awaiting it here, so swallow the rejection rather than leaving it unhandled.
  const handleSave = event => {
    Promise.resolve(bridgeRef.current?.submitForm(event)).catch(() => {});
  };

  const handleDiscard = () => {
    setIsConfirmingDiscard(false);
    onClose();
  };

  const title = <TranslatedText stringId="patient.details.title" fallback="Patient details" />;

  return (
    <>
      {/* Stays mounted behind the discard prompt, so Go back returns to the form with its edits. */}
      <BaseModal
        open={open}
        onClose={handleRequestClose}
        title={title}
        width="md"
        fixedBottomRow
        bottomRowContent={
          isLoading ? null : (
            <BottomRow>
              <StyledButtonRow>
                {editable ? (
                  <>
                    <OutlinedButton
                      onClick={handleRequestClose}
                      data-testid="patient-details-cancel"
                    >
                      <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                    </OutlinedButton>
                    <NoteModalActionBlocker>
                      <Button
                        data-testid="patient-details-save"
                        onClick={handleSave}
                        disabled={formState.isSubmitting}
                        isSubmitting={formState.isSubmitting}
                      >
                        <TranslatedText stringId="general.action.save" fallback="Save" />
                      </Button>
                    </NoteModalActionBlocker>
                  </>
                ) : (
                  <Button onClick={handleRequestClose} data-testid="patient-details-close">
                    <TranslatedText stringId="general.action.close" fallback="Close" />
                  </Button>
                )}
              </StyledButtonRow>
            </BottomRow>
          )
        }
      >
        {isLoading ? (
          <LoadingIndicator />
        ) : (
          <ReadOnlyFormProvider readOnly={!editable}>
            <div ref={contentRef}>
              <PatientDetailsForm
                patient={patient}
                additionalData={additionalData}
                birthData={birthData}
                insurancePlans={insurancePlans}
                onSubmit={handleSubmit}
                hideSubmitButton
                renderExtraContent={({ submitForm }) => (
                  <FormBridge
                    submitForm={submitForm}
                    bridgeRef={bridgeRef}
                    onStateChange={setFormState}
                  />
                )}
              />
            </div>
          </ReadOnlyFormProvider>
        )}
      </BaseModal>
      <ConfirmModal
        open={isConfirmingDiscard}
        title={
          <TranslatedText
            stringId="general.modal.unsavedChanges.title"
            fallback="Unsaved changes"
          />
        }
        subText={
          <TranslatedText
            stringId="general.modal.unsavedChanges.subtext"
            fallback="You have unsaved changes. Are you sure you would like to discard those changes?"
          />
        }
        confirmButtonText={
          <TranslatedText stringId="general.action.discardChanges" fallback="Discard changes" />
        }
        cancelButtonText={<TranslatedText stringId="general.action.goBack" fallback="Go back" />}
        onConfirm={handleDiscard}
        onCancel={() => setIsConfirmingDiscard(false)}
      />
    </>
  );
};
