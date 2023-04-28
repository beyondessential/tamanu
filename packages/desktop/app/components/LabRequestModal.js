import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { LAB_REQUEST_FORM_TYPES } from 'shared/constants/labs';
import styled from 'styled-components';
import { useApi, useSuggester } from '../api';
import { combineQueries } from '../api/combineQueries';
import { Modal } from './Modal';
import { LabRequestMultiStepForm } from '../forms/LabRequestForm/LabRequestMultiStepForm';
import { LabRequestSummaryPane } from '../views/patients/components/LabRequestSummaryPane';
import { useEncounter } from '../contexts/Encounter';

const StyledModal = styled(Modal)`
  .MuiDialog-paper {
    max-width: 926px;
  }
`;

const SECTION_TITLES = {
  [LAB_REQUEST_FORM_TYPES.INDIVIDUAL]: 'Individual',
  [LAB_REQUEST_FORM_TYPES.PANEL]: 'Panel',
};

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

export const LabRequestModal = React.memo(({ open, onClose, encounter }) => {
  const [sectionTitle, setSectionTitle] = useState('');
  const api = useApi();
  const { loadEncounter } = useEncounter();
  const [newLabRequestIds, setNewLabRequestIds] = useState([]);
  const { isSuccess, isLoading, data: newLabRequests } = useLabRequests(newLabRequestIds);
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const handleSubmit = async data => {
    const response = await api.post(`labRequest`, {
      ...data,
      encounterId: encounter.id,
    });
    setNewLabRequestIds(response.map(request => request.id));
  };

  const handleClose = async () => {
    if (newLabRequests.length > 0) {
      setNewLabRequestIds([]);
      await loadEncounter(encounter.id);
    }
    onClose();
  };

  const handleChangeStep = (step, values) => {
    const { requestFormType } = values;
    setSectionTitle(step === 0 ? '' : SECTION_TITLES[requestFormType]);
  };

  let ModalBody = (
    <LabRequestMultiStepForm
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      onChangeStep={handleChangeStep}
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
        labRequests={newLabRequests}
        onClose={handleClose}
      />
    );
  }

  return (
    <StyledModal
      title={`New lab request${sectionTitle ? ` | ${sectionTitle}` : ''}`}
      open={open}
      onClose={handleClose}
      minHeight={500}
    >
      {ModalBody}
    </StyledModal>
  );
});
