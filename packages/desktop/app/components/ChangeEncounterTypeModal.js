import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';

import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';

const DumbChangeEncounterTypeModal = React.memo(({ open, encounter, onClose, onSubmit, ...rest }) => (
  <Modal title="Change encounter type" open={open} onClose={onClose}>
    <ChangeEncounterTypeForm onSubmit={onSubmit} onCancel={onClose} encounter={encounter} {...rest} />
  </Modal>
));

export const ChangeEncounterTypeModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => {
    await api.put(`encounter/${encounter.id}`, data);
    dispatch(viewEncounter(encounter.id));
  },
}))(DumbChangeEncounterTypeModal);
