import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';

import { EncounterForm } from '../forms/EncounterForm';

const DumbEncounterModal = React.memo(({ open, onClose, onCreateEncounter, ...rest }) => (
  <Modal title="Check in" open={open} onClose={onClose}>
    <EncounterForm onSubmit={onCreateEncounter} onCancel={onClose} {...rest} />
  </Modal>
));

export const EncounterModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateEncounter: async data => {
    const createdEncounter = await api.post(`encounter`, {
      patientId,
      ...data,
    });
    dispatch(viewEncounter(createdEncounter.id));
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  departmentSuggester: new Suggester(api, 'department'),
}))(DumbEncounterModal);
