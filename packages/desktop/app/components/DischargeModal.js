import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { DischargeForm } from '../forms/DischargeForm';

const DumbDischargeModal = React.memo(
  ({ open, visit, practitionerSuggester, onClose, onDischarge, onDischargeComplete }) => {
    const onSubmit = React.useCallback(async data => {
      await onDischarge(data);
      onDischargeComplete();
    }, []);

    return (
      <Modal title="Discharge" open={open} onClose={onClose}>
        <DischargeForm
          onSubmit={onSubmit}
          onCancel={onClose}
          visit={visit}
          practitionerSuggester={practitionerSuggester}
        />
      </Modal>
    );
  },
);

export const DischargeModal = connectApi((api, dispatch, { visit }) => ({
  onDischarge: data => api.post(`visit/${visit._id}/discharge`, data),
  onDischargeComplete: () => dispatch(viewVisit(visit._id)),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbDischargeModal);
