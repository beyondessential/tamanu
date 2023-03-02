import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useApi, useSuggester } from '../api';
import { combineQueries } from '../api/combineQueries';
import { Modal } from './Modal';
import { LabRequestMultiStepForm } from '../forms/LabRequestForm/LabRequestMultiStepForm';
import { LabRequestSummaryPane } from '../views/patients/components/LabRequestSummaryPane';

const useLabRequests = labRequestIds => {
  const api = useApi();
  const queries = useQueries({
    queries: labRequestIds.map(labRequestId => {
      return {
        queryKey: ['labRequest', labRequestId],
        queryFn: () => api.get(`labRequest/${labRequestId}`),
        enabled: !!labRequestIds,
      };
    }),
  });
  return combineQueries(queries);
};

export const LabRequestModal = ({ open, onClose, encounter }) => {
  const api = useApi();
  const [labRequestIds, setLabRequestIds] = useState([]);
  const { isSuccess, isLoading, data: labRequests } = useLabRequests(labRequestIds);
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department');

  const handleSubmit = async data => {
    const response = await api.post(`labRequest`, {
      ...data,
      encounterId: encounter.id,
    });
    setLabRequestIds(response.map(request => request.id));
  };

  let ModalBody = (
    <LabRequestMultiStepForm
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      onCancel={onClose}
      encounter={encounter}
      practitionerSuggester={practitionerSuggester}
      departmentSuggester={departmentSuggester}
    />
  );

  if (isSuccess) {
    ModalBody = (
      <LabRequestSummaryPane
        encounter={encounter}
        labRequests={labRequests}
        onClose={() => {
          setLabRequestIds([]);
          onClose();
        }}
      />
    );
  }

  return (
    <Modal maxWidth="md" title="New lab request" open={open} onClose={onClose} minHeight={500}>
      {ModalBody}
    </Modal>
  );
};
