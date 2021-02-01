import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';
import { useEncounter } from '../contexts/Encounter';

const DumbChangeDepartmentModal = React.memo(({ open, onClose, handleSubmit, ...rest }) => {
  const encounterCtx = useEncounter();
  const onSubmit = useCallback(
    departmentId => {
      const { encounter, setEncounterId } = encounterCtx;
      setEncounterId(encounter.id);
      handleSubmit(departmentId, encounter.id);
    },
    [encounterCtx.encounter],
  );

  return (
    <Modal title="Change department" open={open} onClose={onClose}>
      <ChangeDepartmentForm onSubmit={onSubmit} onCancel={onClose} {...rest} />
    </Modal>
  );
});

export const ChangeDepartmentModal = connectApi((api, dispatch) => ({
  departmentSuggester: new Suggester(api, 'department'),
  handleSubmit: async ({ departmentId }, encounterId) => {
    await api.put(`encounter/${encounterId}`, { departmentId });
    dispatch(push(`/patients/encounter/`));
  },
}))(DumbChangeDepartmentModal);
