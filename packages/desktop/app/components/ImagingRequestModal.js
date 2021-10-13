import React, { useCallback } from 'react';
import { customAlphabet } from 'nanoid'

import { Modal } from './Modal';
import { Suggester } from '../utils/suggester';
import { useEncounter } from '../contexts/Encounter';

import { connectApi } from '../api/connectApi';

import { ImagingRequestForm } from '../forms/ImagingRequestForm';

// generates 8 character id (while excluding 0, O, I, 1 and L)
const configureCustomRequestId = () => customAlphabet('ABCDEFGHIJKMNPQRSTUVWXYZ23456789', 8);

const DumbImagingRequestModal = React.memo(
  ({ open, encounter, practitionerSuggester, imagingTypeSuggester, onClose, onSubmit }) => {
    const { loadEncounter } = useEncounter();
    const requestImaging = useCallback(async data => {
      await onSubmit(data);
      await loadEncounter(encounter.id);
      onClose();
    }, []);

    const nanoid = configureCustomRequestId();

    return (
      <Modal width="md" title="New imaging request" open={open} onClose={onClose}>
        <ImagingRequestForm
          onSubmit={requestImaging}
          onCancel={onClose}
          encounter={encounter}
          practitionerSuggester={practitionerSuggester}
          imagingTypeSuggester={imagingTypeSuggester}
          generateId={nanoid}
        />
      </Modal>
    );
  },
);

export const ImagingRequestModal = connectApi((api, dispatch, { encounter }) => ({
  onSubmit: async data => api.post(`imagingRequest`, { ...data, encounterId: encounter.id }),
  practitionerSuggester: new Suggester(api, 'practitioner'),
  imagingTypeSuggester: new Suggester(api, 'imagingType'),
}))(DumbImagingRequestModal);
