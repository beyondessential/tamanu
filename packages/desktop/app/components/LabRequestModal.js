import React, { useState } from 'react';
import { customAlphabet } from 'nanoid';

import { useApi, useSuggester } from '../api';

import { Modal } from './Modal';
import { LabRequestForm } from '../forms/LabRequestForm';
import { ALPHABET_FOR_ID } from '../constants';

export const LabRequestModal = ({ open, onClose, encounter }) => {
  const api = useApi();
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department');
  const labSampleSiteSuggester = useSuggester('labSampleSite');
  const [requestId, setRequestId] = useState();

  return (
    <Modal width="md" title="New lab request" open={open} onClose={onClose}>
      <LabRequestForm
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
        labSampleSiteSuggester={labSampleSiteSuggester}
        generateDisplayId={customAlphabet(ALPHABET_FOR_ID, 7)}
      />
    </Modal>
  );
};
