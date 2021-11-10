import React from 'react';
import { customAlphabet } from 'nanoid'

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { ImagingRequestForm } from '../forms/ImagingRequestForm';
import { ALPHABET_FOR_ID } from '../constants';

// generates 8 character id (while excluding 0, O, I, 1 and L)
const configureCustomRequestId = () => customAlphabet(ALPHABET_FOR_ID, 8);

export const ImagingRequestModal = ({ open, onClose, onSaved, encounter }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const imagingTypeSuggester = new Suggester(api, 'imagingType');
  const generateDisplayId = configureCustomRequestId();

  return (
    <Modal width="md" title="New imaging request" open={open} onClose={onClose}>
      <ImagingRequestForm
        onSubmit={async data => {
          api.post(`imagingRequest`, {
            ...data,
            encounterId: encounter.id 
          });
          onSaved();
        }}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        imagingTypeSuggester={imagingTypeSuggester}
        generateId={generateDisplayId}
      />
    </Modal>
  );
};
