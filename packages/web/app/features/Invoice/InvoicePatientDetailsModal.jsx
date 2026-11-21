import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import {
  BaseModal,
  Button,
  ButtonRow,
  OutlinedButton,
  ReadOnlyFormProvider,
} from '@tamanu/ui-components';

import {
  usePatientAdditionalDataQuery,
  usePatientBirthDataQuery,
  usePatientDataQuery,
  usePatientInsurancePlansQuery,
} from '../../api/queries';
import { useSavePatientDetails } from '../../api/mutations';
import { Colors } from '../../constants';
import { ConfirmModal } from '../../components/ConfirmModal';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { NoteModalActionBlocker } from '../../components';
import { PatientDetailsForm } from '../../forms/PatientDetailsForm/PatientDetailsForm';
import { useFocusPatientField } from './useFocusPatientField';
import { TranslatedText } from '../../components/Translation';

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
  const savePatientDetails = useSavePatientDetails(patientId);

  const formActionsRef = useRef(null);
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

  useFocusPatientField(focusField, open && !isLoading, contentRef);

  const handleSubmit = async data => {
    if (!(await savePatientDetails(data))) return;

    // The edits are saved, so the form is no longer holding anything unsaved. Clear it before the
    // caller decides what comes next: it may keep the modal up while it checks, and closing it
    // then would otherwise offer to discard what has just been written.
    formActionsRef.current?.resetForm();
    onSaved();
  };

  // Escape, the corner close button and Cancel all land here, so the unsaved-changes prompt covers
  // every way out of the modal. A save already in flight is not unsaved work, so it is not offered
  // for discarding while the server has it.
  const handleRequestClose = useCallback(() => {
    if (formState.dirty && !formState.isSubmitting) {
      setIsConfirmingDiscard(true);
      return;
    }
    onClose();
  }, [formState.dirty, formState.isSubmitting, onClose]);

  // The handler rejects when validation fails, having already put the messages on the fields.
  // Nothing is awaiting it here, so swallow the rejection rather than leaving it unhandled.
  const handleSave = event => {
    Promise.resolve(formActionsRef.current?.submitForm(event)).catch(() => {});
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
                formActionsRef={formActionsRef}
                onFormStateChange={setFormState}
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
