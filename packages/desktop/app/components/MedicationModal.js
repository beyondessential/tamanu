import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { useEncounter } from '../contexts/Encounter';
import { Suggester } from '../utils/suggester';

import { MedicationForm } from '../forms/MedicationForm';

const DumbMedicationModal = React.memo(
  ({ open, onClose, onSubmit, practitionerSuggester, drugSuggester }) => {
    const { fetchData } = useEncounter();
    const submitPrescription = useCallback(data => {
      onSubmit(data);
      fetchData();
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

export const MedicationModal = connectApi((api, dispatch, { encounterId, onClose }) => ({
  onSubmit: async data => {
    await api.post('medication', {
      encounterId,
      ...data,
    });
    dispatch(push(`/patients/encounter/`));
    onClose();
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  drugSuggester: new Suggester(api, 'drug'),
}))(DumbMedicationModal);
