import React, { useState } from 'react';
import { customAlphabet } from 'nanoid';
import { useApi, useSuggester } from '../api';
import { Modal } from './Modal';
import { LabRequestMultiStepForm } from '../forms/LabRequestForm/LabRequestMultiStepForm';
import { ALPHABET_FOR_ID } from '../constants';
import { LabRequestSummaryPane } from '../views/patients/components/LabRequestSummaryPane';

export const LabRequestModal = ({ open, onClose, encounter }) => {
  const api = useApi();
  const [labRequestId, setLabRequestId] = useState(false);
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department');

  return (
    <Modal maxWidth="md" title="New lab request" open={open} onClose={onClose}>
      {labRequestId ? (
        <LabRequestSummaryPane labRequestId={labRequestId} />
      ) : (
        <LabRequestMultiStepForm
          onSubmit={async data => {
            const response = await api.post(`labRequest`, {
              ...data,
              encounterId: encounter.id,
            });
            setLabRequestId(response.id);
            // console.log('response', response, JSON.stringify(response));
          }}
          onCancel={onClose}
          encounter={encounter}
          practitionerSuggester={practitionerSuggester}
          departmentSuggester={departmentSuggester}
          generateDisplayId={customAlphabet(ALPHABET_FOR_ID, 7)}
        />
      )}
    </Modal>
  );
};
