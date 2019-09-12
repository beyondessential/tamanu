import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';

import { TriageForm } from '../forms/TriageForm';

const DumbTriageModal = React.memo(({ open, visit, practitionerSuggester, onClose, onSubmit }) => (
  <Modal title="Triage" open={open} width="lg" onClose={onClose}>
    <TriageForm
      onSubmit={onSubmit}
      onCancel={onClose}
      visit={visit}
      practitionerSuggester={practitionerSuggester}
    />
  </Modal>
));

export const TriageModal = connectApi((api, dispatch, { patientId }) => ({
  onSubmit: async data => {
    // await api.post(`patient/{patientId}/triages`, data);
    // dispatch(viewPatient(patientId));
    console.log(data);
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),

  locationSuggester: new Suggester(api, 'location'),
}))(DumbTriageModal);
