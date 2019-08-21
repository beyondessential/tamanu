import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { DischargeForm } from '../forms/DischargeForm';

const DumbVisitModal = React.memo(
  ({
    open,
    patientId,
    visitId,
    locationSuggester,
    practitionerSuggester,
    onClose,
    onCreateVisit,
    onViewVisit,
  }) => {
    const onSubmit = React.useCallback(
      async data => {
        const createdVisit = await onDischarge(data);
        onViewVisit(visitId);
      },
      [visitId],
    );

    return (
      <Modal title="Discharge" open={open} onClose={onClose}>
        <DischargeForm
          onSubmit={onSubmit}
          onCancel={onClose}
          practitionerSuggester={practitionerSuggester}
        />
      </Modal>
    );
  },
);

export const VisitModal = connectApi((api, dispatch, { patientId, visitId }) => ({
  onDischarge: data => api.post(`patient/${patientId}/visits/${visitId}/discharge`, data),
  onViewVisit: visitId => dispatch(viewVisit(visitId)),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbVisitModal);
