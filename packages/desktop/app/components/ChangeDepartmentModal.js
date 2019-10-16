import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';
import { Suggester } from '../utils/suggester';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';

const DumbChangeDepartmentModal = React.memo(({ open, visit, onClose, onSubmit, ...rest }) => (
  <Modal title="Change department" open={open} onClose={onClose}>
    <ChangeDepartmentForm onSubmit={onSubmit} onCancel={onClose} visit={visit} {...rest} />
  </Modal>
));

export const ChangeDepartmentModal = connectApi((api, dispatch, { visit }) => ({
  departmentSuggester: new Suggester(api, 'department'),
  onSubmit: async data => {
    await api.put(`visit/${visit._id}/department`, data);
    dispatch(viewVisit(visit._id));
  },
}))(DumbChangeDepartmentModal);
