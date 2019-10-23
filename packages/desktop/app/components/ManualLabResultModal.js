import React from 'react';
import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { reloadLab } from '../store/labRequest';

export const ManualLabResultModal = connectApi((api, dispatch, { labTest, labRequest }) => ({
  onSubmit: async data => {
    await api.put(`labTest/${labTest._id}`, data);
    dispatch(reloadLab(labRequest._id));
  },
}))(({ open, labTest, onClose, onSubmit }) => (
  <Modal open={!!labTest} onClose={onClose} title="Enter lab result">
    <button onClick={() => onSubmit({ result: "100" })}>100</button>
  </Modal>
));
