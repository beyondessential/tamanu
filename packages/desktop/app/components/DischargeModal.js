import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { DischargeForm } from '../forms/DischargeForm';

const DumbDischargeModal = React.memo(
  ({
    open,
    visit,
    locationSuggester,
    practitionerSuggester,
    onClose,
    onDischarge,
    onViewVisit,
  }) => {
    const onSubmit = React.useCallback(
      async data => {
        const createdVisit = await onDischarge(data);
        onViewVisit(visit._id);
      },
      [visit._id],
    );

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
  onViewVisit: visitId => dispatch(viewVisit(visit._id)),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbDischargeModal);
