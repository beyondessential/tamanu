import React, { useCallback } from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';

import { EncounterForm } from '../forms/EncounterForm';
import { useEncounter } from '../contexts/Encounter';

const DumbEncounterModal = React.memo(({ open, onClose, onCreateEncounter, ...rest }) => {
  const { setEncounterId } = useEncounter();

  const createEncounter = useCallback(async data => {
    const id = await onCreateEncounter(data);
    setEncounterId(id);
  }, []);

  return (
    <Modal title="Check in" open={open} onClose={onClose}>
      <EncounterForm onSubmit={createEncounter} onCancel={onClose} {...rest} />
    </Modal>
  );
});

export const EncounterModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateEncounter: async data => {
    const createdEncounter = await api.post(`encounter`, {
      patientId,
      ...data,
    });
    return createdEncounter.id;
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  departmentSuggester: new Suggester(api, 'department'),
}))(DumbEncounterModal);
