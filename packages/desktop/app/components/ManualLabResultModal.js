import React from 'react';
import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { reloadLab } from '../store/labRequest';

import { ManualLabResultForm } from '../forms/ManualLabResultForm';

export const ManualLabResultModal = connectApi((api, dispatch, { labTest, labRequest }) => ({
  onSubmit: async data => {
    await api.put(`labTest/${labTest._id}`, { result: `${data.result}` });
    dispatch(reloadLab(labRequest._id));
  },
}))(({ open, labTest, onClose, onSubmit }) => (
  <Modal open={!!labTest} onClose={onClose} title="Enter lab result">
    <ManualLabResultForm onSubmit={onSubmit} onClose={onClose} />
  </Modal>
));
