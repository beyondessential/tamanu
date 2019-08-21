import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { VisitForm } from '../forms/VisitForm';

const DumbVisitModal = React.memo(
  ({
    open,
    patientId,
    locationSuggester,
    practitionerSuggester,
    onClose,
    onCreateVisit,
    onViewVisit,
  }) => {
    const onSubmit = React.useCallback(
      async data => {
        const createdVisit = await onCreateVisit(data);
        onViewVisit(createdVisit._id);
      },
      [patientId],
    );

    return (
      <Modal title="Check in" open={open} onClose={onClose}>
        <VisitForm
          onSubmit={onSubmit}
          onCancel={onClose}
          locationSuggester={locationSuggester}
          practitionerSuggester={practitionerSuggester}
        />
      </Modal>
    );
  },
);

export const VisitModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateVisit: data => api.post(`patient/${patientId}/visits`, data),
  onViewVisit: visitId => dispatch(viewVisit(visitId)),
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbVisitModal);
