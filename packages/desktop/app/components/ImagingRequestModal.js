import React from 'react';
import shortid from 'shortid';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { ImagingRequestForm } from '../forms/ImagingRequestForm';

const DumbImagingRequestModal = React.memo(
  ({ open, visit, practitionerSuggester, onClose, onSubmit }) => (
    <Modal width="md" title="New imaging request" open={open} onClose={onClose}>
      <ImagingRequestForm
        onSubmit={onSubmit}
        onCancel={onClose}
        visit={visit}
        practitionerSuggester={practitionerSuggester}
        generateId={shortid.generate}
      />
    </Modal>
  ),
);

export const ImagingRequestModal = connectApi((api, dispatch, { visit }) => ({
  onSubmit: async data => {
    const visitId = visit._id;
    await api.post(`visit/${visitId}/imagingRequest`, data);
    dispatch(viewVisit(visitId));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
}))(DumbImagingRequestModal);
