import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';
import { Modal } from './Modal';

export const ChangeDepartmentModal = React.memo(({ open, onClose }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const api = useApi();
  const departmentSuggester = new Suggester(api, 'department');
  const encounterCtx = useEncounter();
  const onSubmit = useCallback(
    async data => {
      const { encounter, writeAndViewEncounter } = encounterCtx;
      await writeAndViewEncounter(encounter.id, data);
      dispatch(push(`/patients/${params.category}/${params.patientId}/encounter/${encounter.id}/`));
    },
    [encounterCtx, params.category, params.patientId, dispatch],
  );

  return (
    <Modal title="Change department" open={open} onClose={onClose}>
      <ChangeDepartmentForm
        onSubmit={onSubmit}
        onCancel={onClose}
        departmentSuggester={departmentSuggester}
      />
    </Modal>
  );
});
