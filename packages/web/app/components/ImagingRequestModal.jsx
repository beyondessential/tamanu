import { customAlphabet } from 'nanoid';
import React, { useState } from 'react';

import { useApi } from '../api';
import { useImagingRequestMutation } from '../api/mutations';
import { ALPHABET_FOR_ID } from '../constants';
import { ImagingRequestForm } from '../forms/ImagingRequestForm';
import { Suggester } from '../utils/suggester';
import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';

// Todo: move the generating of display id to the model default to match LabRequests
// generates 8 character id (while excluding 0, O, I, 1 and L)
const configureCustomRequestId = () => customAlphabet(ALPHABET_FOR_ID, 8);

export const ImagingRequestModal = ({ open, onClose, encounter }) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');
  const generateDisplayId = configureCustomRequestId();
  const [onSuccess, setOnSuccess] = useState(null);

  const { mutateAsync: mutateImagingRequest } = useImagingRequestMutation(encounter.id, {
    onSuccess: (data, variables, context) => {
      onSuccess?.(data, variables, context);
      onClose?.();
    },
  });

  return (
    <FormModal
      width="md"
      title={
        <TranslatedText
          stringId="imaging.modal.create.title"
          fallback="New imaging request"
          data-testid='translatedtext-2k84' />
      }
      open={open}
      onClose={onClose}
      data-testid='formmodal-k53m'>
      <ImagingRequestForm
        onSubmit={mutateImagingRequest}
        onCancel={onClose}
        setOnSuccess={setOnSuccess}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        generateId={generateDisplayId}
        data-testid='imagingrequestform-1dqs' />
    </FormModal>
  );
};
