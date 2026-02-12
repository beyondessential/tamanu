import React, { useCallback, useState } from 'react';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

import { CheckInModal } from './CheckInModal';
import { TriageModal } from './TriageModal';
import { SelectEncounterTypeModal } from './SelectEncounterTypeModal';

// Initial state should always be SELECT_OPEN
const MODAL_STATES = {
  SELECT_OPEN: 'select',
  ENCOUNTER_OPEN: 'encounter',
  TRIAGE_OPEN: 'triage',
};

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
    withExistingEncounterCheck,
  }) => {
    const [modalStatus, setModalStatus] = useState(MODAL_STATES.SELECT_OPEN);
    const [encounterType, setEncounterType] = useState(null);

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
      </>
    );
  },
);
