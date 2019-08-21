import React from 'react';
import { connect } from 'react-redux';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { VisitForm } from '../forms/VisitForm';

const DumbVisitModal = React.memo(({ api, onClose, open, patientId, onViewVisit }) => {
  const onSubmit = React.useCallback(
    async data => {
      const createdVisit = await api.post(`patient/${patientId}/visits`, data);
      onViewVisit(createdVisit._id);
      onClose();
    },
    [patientId],
  );

  return (
    <Modal title="Check in" open={open} onClose={onClose}>
      <VisitForm
        onSubmit={onSubmit}
        onCancel={onClose}
        locationSuggester={new Suggester(api, 'location')}
        practitionerSuggester={new Suggester(api, 'practitioner')}
      />
    </Modal>
  );
});

export const VisitModal = connect(
  null,
  dispatch => ({ onViewVisit: visitId => dispatch(viewVisit(visitId)) }),
)(connectApi(api => ({ api }))(DumbVisitModal));
