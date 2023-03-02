import React, { useState } from 'react';
import { useApi, useSuggester } from '../api';
import { Modal } from './Modal';
import { LabRequestMultiStepForm } from '../forms/LabRequestForm/LabRequestMultiStepForm';
import { LabRequestSummaryPane } from '../views/patients/components/LabRequestSummaryPane';

export const LabRequestModal = ({ open, onClose, encounter }) => {
  const api = useApi();
  const [labRequests, setLabRequests] = useState(null);
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department');

  return (
    <Modal maxWidth="md" title="New lab request" open={open} onClose={onClose}>
      {labRequests ? (
        <LabRequestSummaryPane labRequests={labRequests} />
      ) : (
        <LabRequestMultiStepForm
          onSubmit={async data => {
            const response = await api.post(`labRequest`, {
              ...data,
              encounterId: encounter.id,
            });
            setLabRequests(response);
          }}
          onCancel={onClose}
          encounter={encounter}
          practitionerSuggester={practitionerSuggester}
          departmentSuggester={departmentSuggester}
        />
      )}
    </Modal>
  );
};
