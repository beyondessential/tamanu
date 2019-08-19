import React from 'react';
import { connect } from 'react-redux';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { VitalsForm } from '../forms/VitalsForm';

export const VitalsModal = connect()(connectApi(api => ({ api }))(
  React.memo(({ api, onClose, open, visitId, dispatch }) => {
    const onSubmit = async (data) => {
      const resp = await api.post(`visit/${visitId}/vitals`, data);
      dispatch(viewVisit(visitId));
      onClose();
    };

    return (
      <Modal title="Record vitals" isVisible={true} onClose={onClose}>
        <VitalsForm
          form={VitalsForm}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </Modal>
    );
  })
));
