import React, { useState } from 'react';
import { customAlphabet } from 'nanoid';

import { useApi, useSuggester } from '../api';

import { Modal } from './Modal';
import { LabRequestMultiStepForm } from '../forms/LabRequestForm/LabRequestMultiStepForm';
import { ALPHABET_FOR_ID } from '../constants';

export const LabRequestModal = ({ open, onClose, encounter }) => {
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department');
  const [requestId, setRequestId] = useState();

  return (
    <Modal width="md" title="New lab request" open={open} onClose={onClose}>
      <LabRequestMultiStepForm
        onSubmit={async data => {
          const newRequest = await api.post(`labRequest`, {
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
        departmentSuggester={departmentSuggester}
        generateDisplayId={customAlphabet(ALPHABET_FOR_ID, 7)}
      />
    </Modal>
  );
};
