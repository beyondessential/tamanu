import React, { useCallback } from 'react';
import { push } from 'connected-react-router';
import { useEncounter } from '../contexts/Encounter';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';

import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';

const DumbChangeEncounterTypeModal = React.memo(
  ({ open, encounter, onClose, onSubmit, ...rest }) => {
    const { fetchData } = useEncounter();
    const changeEncounterType = useCallback(data => {
      onSubmit(data);
      fetchData();
      onClose();
    }, []);

    return (
      <Modal title="Change encounter type" open={open} onClose={onClose}>
        <ChangeEncounterTypeForm
          onSubmit={changeEncounterType}
          onCancel={onClose}
          encounter={encounter}
          {...rest}
        />
      </Modal>
    );
  },
);

export const ChangeEncounterTypeModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => {
    await api.put(`encounter/${encounter.id}`, data);
    dispatch(push(`/patients/encounter/`));
  },
}))(DumbChangeEncounterTypeModal);
