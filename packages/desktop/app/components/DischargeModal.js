import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';

import { DischargeForm } from '../forms/DischargeForm';

const DumbDischargeModal = React.memo(
  ({ open, encounter, practitionerSuggester, onClose, onSubmit }) => (
    <Modal title="Discharge" open={open} onClose={onClose}>
      <DischargeForm
        onSubmit={onSubmit}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
      />
    </Modal>
  ),
);

export const DischargeModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => {
    await api.put(`encounter/${encounter.id}`, data);
    dispatch(viewEncounter(encounter.id));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbDischargeModal);
