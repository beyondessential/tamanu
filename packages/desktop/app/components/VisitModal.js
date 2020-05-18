import React from 'react';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { VisitForm } from '../forms/VisitForm';

const DumbVisitModal = React.memo(({ open, onClose, onCreateVisit, ...rest }) => (
  <Modal title="Check in" open={open} onClose={onClose}>
    <VisitForm onSubmit={onCreateVisit} onCancel={onClose} {...rest} />
  </Modal>
));

export const VisitModal = connectApi((api, dispatch, { patientId }) => ({
  onCreateVisit: async data => {
    const createdVisit = await api.post(`visit`, {
      patientId,
      ...data,
    });
    dispatch(viewVisit(createdVisit.id));
  },
  locationSuggester: new Suggester(api, 'location'),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  departmentSuggester: new Suggester(api, 'department'),
}))(DumbVisitModal);
