import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

import { BodyText, Modal, ModalActionRow, TranslatedText } from '.';

import { CheckInModal } from './CheckInModal';
import { TriageModal } from './TriageModal';
import { SelectEncounterTypeModal } from './SelectEncounterTypeModal';
import { usePatientCurrentEncounterQuery } from '../api/queries';

// Initial state should always be SELECT_OPEN
const MODAL_STATES = {
  SELECT_OPEN: 'select',
  ENCOUNTER_OPEN: 'encounter',
  TRIAGE_OPEN: 'triage',
};

const StyledBodyText = styled(BodyText)`
  margin: 60px;
  margin-bottom: 78px;
`;

export const ExistingEncounterWarningModal = React.memo(({ open, onClose }) => {
  return (
    <Modal
      title={
        <TranslatedText
          stringId="patient.modal.activeEncounterWarning.title"
          fallback="Cannot create new encounter"
        />
      }
      width="sm"
      open={open}
      onClose={onClose}
      data-testid="formmodal-4oua"
    >
      <StyledBodyText>
        <TranslatedText
          stringId="patient.encounterSummary.activeEncounterWarning"
          fallback="This patient has an active encounter. The active encounter must be discharged before a new encounter can be created."
        />
      </StyledBodyText>
      <ModalActionRow onConfirm={onClose} confirmText="Close" />
    </Modal>
  );
});

// Self-contained wrapper logic for 3 different modals
// you should be able to use it as a regular modal.
export const EncounterModal = React.memo(
  ({
    open,
    onClose,
    onSubmitEncounter,
    noRedirectOnSubmit,
    referral,
    patient,
    patientBillingTypeId,
    initialValues,
  }) => {
    const queryClient = useQueryClient();
    const [modalStatus, setModalStatus] = useState(MODAL_STATES.SELECT_OPEN);
    const [encounterType, setEncounterType] = useState(null);
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const { refetch: refetchCurrentEncounter } = usePatientCurrentEncounterQuery(patient.id);

    const onCloseWarningModal = useCallback(async () => {
      setIsWarningModalOpen(false);
      await queryClient.invalidateQueries(['patientCurrentEncounter', patient.id]); // Refresh the current encounter data on close
    }, [queryClient, patient.id]);

    const checkForExistingEncounter = useCallback(async () => {
      const { data: encounter } = await refetchCurrentEncounter();
      return !!encounter;
    }, [refetchCurrentEncounter]);

    const withExistingEncounterCheck = useCallback(
      async onSuccess => {
        const hasExistingEncounter = await checkForExistingEncounter();
        if (hasExistingEncounter) {
          setIsWarningModalOpen(true);
        } else {
          await onSuccess();
        }
      },
      [checkForExistingEncounter],
    );

    const onCloseModal = useCallback(() => {
      // Reset to default state
      setModalStatus(MODAL_STATES.SELECT_OPEN);
      onClose();
    }, [onClose]);
    const onSelectEncounterType = useCallback(value => {
      if (value === ENCOUNTER_TYPES.TRIAGE) {
        setModalStatus(MODAL_STATES.TRIAGE_OPEN);
        return;
      }

      setEncounterType(value);
      setModalStatus(MODAL_STATES.ENCOUNTER_OPEN);
    }, []);

    // Simply ignore if main modal isn't open
    if (!open) {
      return null;
    }

    return (
      <>
        <SelectEncounterTypeModal
          open={modalStatus === MODAL_STATES.SELECT_OPEN}
          onClose={onCloseModal}
          onSelectEncounterType={onSelectEncounterType}
          data-testid="selectencountertypemodal-dty8"
        />
        <CheckInModal
          open={modalStatus === MODAL_STATES.ENCOUNTER_OPEN}
          onClose={onCloseModal}
          onSubmitEncounter={onSubmitEncounter}
          encounterType={encounterType}
          patientId={patient.id}
          patientBillingTypeId={patientBillingTypeId}
          referral={referral}
          initialValues={initialValues}
          data-testid="checkinmodal-7ijs"
          withExistingEncounterCheck={withExistingEncounterCheck}
        />
        <TriageModal
          open={modalStatus === MODAL_STATES.TRIAGE_OPEN}
          onSubmitEncounter={onSubmitEncounter}
          noRedirectOnSubmit={noRedirectOnSubmit}
          onClose={onCloseModal}
          patient={patient}
          initialValues={initialValues}
          data-testid="triagemodal-715s"
          withExistingEncounterCheck={withExistingEncounterCheck}
        />
        <ExistingEncounterWarningModal open={isWarningModalOpen} onClose={onCloseWarningModal} />
      </>
    );
  },
);
