import React from 'react';
import shortid from 'shortid';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { LabRequestForm } from '../forms/LabRequestForm';

const DumbLabRequestModal = React.memo(
  ({ open, visit, practitionerSuggester, onClose, onSubmit }) => (
    <Modal width="md" title="New lab request" open={open} onClose={onClose}>
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
    const visitId = visit._id;
    await api.post(`visit/${visitId}/labRequest`, data);
    dispatch(viewVisit(visitId));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbLabRequestModal);
