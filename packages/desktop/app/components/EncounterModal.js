import React, { useCallback } from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';

import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';

const DumbEncounterModal = React.memo(
  ({ open, onClose, onCreateEncounter, patientId, ...rest }) => {
    const { createAndViewEncounter } = useEncounter();

    const createEncounter = useCallback(
      async data => {
        await createAndViewEncounter({ patientId, ...data });
        onClose();
      },
      [patientId],
    );

    return (
      <Modal title="Check in" open={open} onClose={onClose}>
        <EncounterForm onSubmit={createEncounter} onCancel={onClose} {...rest} />
      </Modal>
    );
  },
);

export const EncounterModal = connectApi(api => ({
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  departmentSuggester: new Suggester(api, 'department'),
}))(DumbEncounterModal);
