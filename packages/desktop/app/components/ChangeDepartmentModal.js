import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { useApi } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';
import { Modal } from './Modal';

export const ChangeDepartmentModal = React.memo(({ open, onClose }) => {
  const params = useParams();
  const api = useApi();
  const departmentSuggester = new Suggester(api, 'department');
  const encounterCtx = useEncounter();
  const onSubmit = useCallback(
    data => {
      const { encounter, writeAndViewEncounter } = encounterCtx;
      writeAndViewEncounter(params.patientId, encounter.id, data, params.category);
    },
    [encounterCtx, params.category, params.patientId],
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
