import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { DischargeForm } from '../forms/DischargeForm';

const DumbDischargeModal = React.memo(
  ({ open, visit, practitionerSuggester, onClose, onSubmit }) => (
    <Modal title="Discharge" open={open} onClose={onClose}>
      <DischargeForm
        onSubmit={onSubmit}
        onCancel={onClose}
        visit={visit}
        practitionerSuggester={practitionerSuggester}
      />
    </Modal>
  ),
);

export const DischargeModal = connectApi((api, dispatch, { visit }) => ({
  onSubmit: async data => {
    await api.put(`visit/${visit.id}`, data);
    dispatch(viewVisit(visit.id));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbDischargeModal);
