import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { useEncounter } from '../contexts/Encounter';
import { Suggester } from '../utils/suggester';

import { MedicationForm } from '../forms/MedicationForm';

const DumbMedicationModal = React.memo(
  ({ open, onClose, onSubmit, practitionerSuggester, drugSuggester, encounterId }) => {
    const { fetchAndSetEncounterData } = useEncounter();
    const submitPrescription = useCallback(async data => {
      await onSubmit(data);
      await fetchAndSetEncounterData(encounterId);
      onClose();
    }, []);

    return (
      <Modal title="Prescribe medication" open={open} onClose={onClose}>
        <MedicationForm
          form={MedicationForm}
          onSubmit={submitPrescription}
          onCancel={onClose}
          practitionerSuggester={practitionerSuggester}
          drugSuggester={drugSuggester}
        />
      </Modal>
    );
  },
);

export const MedicationModal = connectApi((api, dispatch, { encounterId }) => ({
  onSubmit: async data => {
    await api.post('medication', {
      encounterId,
      ...data,
    });
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  drugSuggester: new Suggester(api, 'drug'),
}))(DumbMedicationModal);
