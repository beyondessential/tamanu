import React from 'react';
import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { reloadLab } from '../store/labRequest';

import { ConnectedChangeLaboratoryForm } from '../forms/ChangeLaboratoryForm';

export const ChangeLaboratoryModal = connectApi((api, dispatch, { labRequest }) => ({
  onSubmit: async data => {
    await api.put(`labRequest/${labRequest.id}`, { labTestLaboratoryId: data.labTestLaboratoryId });
    dispatch(reloadLab(labRequest.id));
  },
}))(({ labRequest, onClose, open, onSubmit }) => (
  <Modal open={open} onClose={onClose} title="Change lab request laboratory">
    <ConnectedChangeLaboratoryForm labRequest={labRequest} onSubmit={onSubmit} onCancel={onClose} />
  </Modal>
));
