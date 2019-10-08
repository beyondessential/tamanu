import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { ChangeVisitTypeForm } from '../forms/ChangeVisitTypeForm';

const DumbChangeTypeModal = React.memo(({ open, visit, onClose, onSubmit, ...rest }) => (
  <Modal title="Change visit type" open={open} onClose={onClose}>
    <ChangeVisitTypeForm onSubmit={onSubmit} onCancel={onClose} visit={visit} {...rest} />
  </Modal>
));

export const ChangeTypeModal = connectApi((api, dispatch, { visit }) => ({
  onSubmit: async data => {
    await api.put(`visit/${visit._id}`, data);
    dispatch(viewVisit(visit._id));
  },
}))(DumbChangeTypeModal);
