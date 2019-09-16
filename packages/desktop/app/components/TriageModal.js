import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';

import { TriageForm } from '../forms/TriageForm';

import { push } from 'connected-react-router';

const DumbTriageModal = React.memo(
  ({ open, visit, practitionerSuggester, locationSuggester, onClose, onSubmit }) => (
    <Modal title="Triage" open={open} width="lg" onClose={onClose}>
      <TriageForm
        onSubmit={onSubmit}
        onCancel={onClose}
        visit={visit}
        practitionerSuggester={practitionerSuggester}
        locationSuggester={locationSuggester}
      />
    </Modal>
  ),
);

export const TriageModal = connectApi((api, dispatch, { patientId }) => ({
  onSubmit: async data => {
    await api.post(`patient/${patientId}/triages`, data);
    dispatch(push('/patients/triage'));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  locationSuggester: new Suggester(api, 'location'),
}))(DumbTriageModal);
