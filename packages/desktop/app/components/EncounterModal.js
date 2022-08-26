import React, { useCallback, useState } from 'react';
import { ENCOUNTER_TYPES } from 'shared/constants';
import { useSelector } from 'react-redux';

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
export const EncounterModal = React.memo(({ open, onClose, referral, patientBillingTypeId }) => {
  const [modalStatus, setModalStatus] = useState(MODAL_STATES.SELECT_OPEN);
  const [encounterType, setEncounterType] = useState(null);
  const patient = useSelector(state => state.patient);

  const onCloseModal = useCallback(() => {
    // Reset to default state
    setModalStatus(MODAL_STATES.SELECT_OPEN);
    // Close modal
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
      />
      <CheckInModal
        open={modalStatus === MODAL_STATES.ENCOUNTER_OPEN}
        onClose={onCloseModal}
        encounterType={encounterType}
        patientId={patient.id}
        patientBillingTypeId={patientBillingTypeId}
        referral={referral}
      />
      <TriageModal
        open={modalStatus === MODAL_STATES.TRIAGE_OPEN}
        onClose={onCloseModal}
        patient={patient}
      />
    </>
  );
});
