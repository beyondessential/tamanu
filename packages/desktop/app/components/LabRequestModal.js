import React from 'react';
import shortid from 'shortid';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { LabRequestForm } from '../forms/LabRequestForm';

const DumbLabRequestModal = React.memo(
  ({ open, visit, practitionerSuggester, onClose, onSubmit }) => (
    <Modal title="New lab request" open={open} onClose={onClose}>
      <LabRequestForm
        onSubmit={onSubmit}
        onCancel={onClose}
        visit={visit}
        practitionerSuggester={practitionerSuggester}
        generateId={shortid.generate}
      />
    </Modal>
  ),
);

export const LabRequestModal = connectApi((api, dispatch, { visit }) => ({
  onSubmit: async data => {
    await api.put(`visit/${visit._id}`, data);
    dispatch(viewVisit(visit._id));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbLabRequestModal);
