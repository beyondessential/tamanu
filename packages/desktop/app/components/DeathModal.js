import React from 'react';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';
import { viewPatient } from '../store/patient';

import { Modal } from './Modal';
import { DeathForm } from '../forms/DeathForm';

const DumbDeathModal = React.memo(
  ({ open, onClose, onSave, icd10Suggester, practitionerSuggester }) => (
    <Modal title="Record patient death" open={open} onClose={onClose}>
      <DeathForm
        onSubmit={onSave}
        onCancel={onClose}
        icd10Suggester={icd10Suggester}
        practitionerSuggester={practitionerSuggester}
      />
    </Modal>
  ),
);

export const DeathModal = connectApi((api, dispatch, { patient, onClose }) => ({
  onSave: async data => {
    const patientId = patient.id;
    await api.put(`patient/${patientId}/death`, data);

    onClose();
    dispatch(viewPatient(patientId));
  },
  icd10Suggester: new Suggester(api, 'icd10'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbDeathModal);
