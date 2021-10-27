import React, { useCallback } from 'react';
import { push } from 'connected-react-router';
import shortid from 'shortid';

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';
import { useEncounter } from '../contexts/Encounter';

import { connectApi } from '../api/connectApi';

import { ImagingRequestForm } from '../forms/ImagingRequestForm';

const DumbImagingRequestModal = React.memo(
  ({ open, encounter, practitionerSuggester, imagingTypeSuggester, onClose, onSubmit }) => {
    const { loadEncounter } = useEncounter();
    const requestImaging = useCallback(async data => {
      await onSubmit(data);
      await loadEncounter(encounter.id);
      onClose();
    }, []);

    return (
      <Modal width="md" title="New imaging request" open={open} onClose={onClose}>
        <ImagingRequestForm
          onSubmit={requestImaging}
          onCancel={onClose}
          encounter={encounter}
          practitionerSuggester={practitionerSuggester}
          imagingTypeSuggester={imagingTypeSuggester}
          generateId={shortid.generate}
        />
      </Modal>
    );
  },
);

export const ImagingRequestModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => api.post(`imagingRequest`, { ...data, id: encounter.id }),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  imagingTypeSuggester: new Suggester(api, 'imagingType'),
}))(DumbImagingRequestModal);
