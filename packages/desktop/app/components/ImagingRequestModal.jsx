import { customAlphabet } from 'nanoid';
import React, { useState } from 'react';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';

import { ALPHABET_FOR_ID } from '../constants';
import { ImagingRequestForm } from '../forms/ImagingRequestForm';
import { FormModal } from './FormModal';

// Todo: move the generating of display id to the model default to match LabRequests
// generates 8 character id (while excluding 0, O, I, 1 and L)
const configureCustomRequestId = () => customAlphabet(ALPHABET_FOR_ID, 8);

export const ImagingRequestModal = ({ open, onClose, encounter }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const generateDisplayId = configureCustomRequestId();
  const [requestId, setRequestId] = useState();

  return (
    <FormModal width="md" title="New imaging request" open={open} onClose={onClose}>
      <ImagingRequestForm
        onSubmit={async data => {
          const newRequest = await api.post(`imagingRequest`, {
            ...data,
            encounterId: encounter.id,
          });
          setRequestId(newRequest.id);
          onClose();
        }}
        onCancel={onClose}
        encounter={encounter}
        requestId={requestId}
        practitionerSuggester={practitionerSuggester}
        generateId={generateDisplayId}
      />
    </FormModal>
  );
};
