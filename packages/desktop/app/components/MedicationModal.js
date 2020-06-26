import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';
import { Suggester } from '../utils/suggester';

import { MedicationForm } from '../forms/MedicationForm';

const DumbMedicationModal = React.memo(
  ({ open, onClose, onSubmit, practitionerSuggester, drugSuggester }) => (
    <Modal title="Prescribe medication" open={open} onClose={onClose}>
      <MedicationForm
        form={MedicationForm}
        onSubmit={onSubmit}
        onCancel={onClose}
        practitionerSuggester={practitionerSuggester}
        drugSuggester={drugSuggester}
      />
    </Modal>
  ),
);

export const MedicationModal = connectApi((api, dispatch, { visitId, onClose }) => ({
  onSubmit: async data => {
    await api.post('medication', {
      visitId, 
      ...data,
    });
    dispatch(viewVisit(visitId));
    onClose();
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  drugSuggester: new Suggester(api, 'drug'),
}))(DumbMedicationModal);
