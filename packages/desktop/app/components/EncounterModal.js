import React, { useCallback } from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewPatientEncounter } from '../store/patient';

import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';

const DumbEncounterModal = React.memo(
  ({ open, onClose, patientId, loadAndViewPatientEncounter, referral, ...rest }) => {
    const { createEncounter } = useEncounter();

    const onCreateEncounter = useCallback(
      async data => {
        await createEncounter({
          patientId,
          referralId: referral?.id,
          ...data,
        });
        loadAndViewPatientEncounter();
        onClose();
      },
      [patientId],
    );

    return (
      <Modal title="Check in" open={open} onClose={onClose}>
        <EncounterForm onSubmit={onCreateEncounter} onCancel={onClose} {...rest} />
      </Modal>
    );
  },
);

export const EncounterModal = connectApi((api, dispatch, { patientId }) => ({
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  departmentSuggester: new Suggester(api, 'department'),
  loadAndViewPatientEncounter: () => dispatch(viewPatientEncounter(patientId)),
}))(DumbEncounterModal);
