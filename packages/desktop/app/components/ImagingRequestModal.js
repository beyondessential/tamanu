import React from 'react';
import shortid from 'shortid';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { Modal } from './Modal';
import { ImagingRequestForm } from '../forms/ImagingRequestForm';

export const ImagingRequestModal = ({ open, onClose, onSaved, encounter }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const imagingTypeSuggester = new Suggester(api, 'imagingType');

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
        generateId={shortid.generate}
      />
    </Modal>
  );
};
