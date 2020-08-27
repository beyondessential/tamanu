import React from 'react';
import shortid from 'shortid';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';

import { ImagingRequestForm } from '../forms/ImagingRequestForm';

const DumbImagingRequestModal = React.memo(
  ({ open, encounter, practitionerSuggester, imagingTypeSuggester, onClose, onSubmit }) => (
    <Modal width="md" title="New imaging request" open={open} onClose={onClose}>
      <ImagingRequestForm
        onSubmit={onSubmit}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        imagingTypeSuggester={imagingTypeSuggester}
        generateId={shortid.generate}
      />
    </Modal>
  ),
);

export const ImagingRequestModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => {
    const encounterId = encounter.id;
    await api.post(`imagingRequest`, { ...data, encounterId });
    dispatch(viewEncounter(encounterId));
  },
  practitionerSuggester: new Suggester(api, 'practitioner'),
  imagingTypeSuggester: new Suggester(api, 'imagingType'),
}))(DumbImagingRequestModal);
