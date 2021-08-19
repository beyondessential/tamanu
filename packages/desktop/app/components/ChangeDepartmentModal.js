import React, { useCallback } from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';
import { useEncounter } from '../contexts/Encounter';

const DumbChangeDepartmentModal = React.memo(({ open, onClose, ...rest }) => {
  const encounterCtx = useEncounter();
  const onSubmit = useCallback(
    data => {
      const { encounter, writeAndViewEncounter } = encounterCtx;
      writeAndViewEncounter(encounter.id, data);
    },
    [encounterCtx.encounter],
  );

  return (
    <Modal title="Change department" open={open} onClose={onClose}>
      <ChangeDepartmentForm onSubmit={onSubmit} onCancel={onClose} {...rest} />
    </Modal>
  );
});

export const ChangeDepartmentModal = connectApi(api => ({
  departmentSuggester: new Suggester(api, 'department'),
}))(DumbChangeDepartmentModal);
