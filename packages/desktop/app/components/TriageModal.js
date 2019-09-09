import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
// import { viewTriage } from '../store/triage';
//
const viewTriage = () => ({});

import { TriageForm } from '../forms/TriageForm';

const DumbTriageModal = React.memo(
  ({
    open,
    locationSuggester,
    practitionerSuggester,
    onClose,
    onCreateTriage,
  }) => {
    return (
      <Modal title="Check in" width="lg" open={open} onClose={onClose}>
        <TriageForm
          onSubmit={onCreateTriage}
          onCancel={onClose}
          locationSuggester={locationSuggester}
          practitionerSuggester={practitionerSuggester}
        />
      </Modal>
    );
  },
);

export const TriageModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateTriage: async data => {
    const createdTriage = await api.post(`patient/${patientId}/triage`, data);
    dispatch(viewTriage(createdTriage._id));
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbTriageModal);
