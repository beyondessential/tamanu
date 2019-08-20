import React from 'react';
import { connect } from 'react-redux';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { VitalsForm } from '../forms/VitalsForm';

const DumbVitalsModal = React.memo(({ api, onClose, visitId, onViewVisit }) => {
  const onSubmit = React.useCallback(
    async data => {
      await api.post(`visit/${visitId}/vitals`, data);
      onViewVisit(visitId);
      onClose();
    },
    [visitId],
  );

  return (
    <Modal title="Record vitals" isVisible onClose={onClose}>
      <VitalsForm form={VitalsForm} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
});

export const VitalsModal = connect(
  null,
  dispatch => ({ onViewVisit: visitId => dispatch(viewVisit(visitId)) }),
)(connectApi(api => ({ api }))(DumbVitalsModal));
