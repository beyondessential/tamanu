import React from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { MedicationForm } from '../forms/MedicationForm';

export const MedicationModal = ({ open, onClose, onSaved, encounterId }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const drugSuggester = new Suggester(api, 'drug');

  return (
    <Modal title="Prescribe medication" open={open} onClose={onClose}>
      <MedicationForm
        onSubmit={async data => {
          await api.post('medication', {
            encounterId,
            ...data,
          });
          onSaved();
        }}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
        drugSuggester={drugSuggester}
      />
    </Modal>
  );
};
