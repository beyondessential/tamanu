import React from 'react';
import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { reloadLab } from '../store/labRequest';

import { ChangeLabStatusForm } from '../forms/ChangeLabStatusForm';

export const ChangeLabStatusModal = connectApi((api, dispatch, { labRequest }) => ({
  onSubmit: async data => {
    await api.put(`labRequest/${labRequest._id}`, { status: data.status });
    dispatch(reloadLab(labRequest._id));
  },
}))(({ labRequest, onClose, open, onSubmit }) => (
  <Modal open={open} onClose={onClose} title="Change lab request status">
    <ChangeLabStatusForm labRequest={labRequest} onSubmit={onSubmit} onClose={onClose} />
  </Modal>
));
