import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';

const DumbChangeDepartmentModal = React.memo(({ open, encounter, onClose, onSubmit, ...rest }) => (
  <Modal title="Change department" open={open} onClose={onClose}>
    <ChangeDepartmentForm onSubmit={onSubmit} onCancel={onClose} encounter={encounter} {...rest} />
  </Modal>
));

export const ChangeDepartmentModal = connectApi((api, dispatch, { encounter }) => ({
  departmentSuggester: new Suggester(api, 'department'),
  onSubmit: async ({ departmentId }) => {
    await api.put(`encounter/${encounter.id}`, { departmentId });
    dispatch(viewEncounter(encounter.id));
  },
}))(DumbChangeDepartmentModal);
