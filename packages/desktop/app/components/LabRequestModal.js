import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import { getCurrentDateString, getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
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
  const [requestFormType, setRequestFormType] = useState(null);
  const [newLabRequestIds, setNewLabRequestIds] = useState([]);
  const api = useApi();
  const { loadEncounter } = useEncounter();
  const { isSuccess, isLoading, data: newLabRequests } = useLabRequests(newLabRequestIds);
  const practitionerSuggester = useSuggester('practitioner');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const handleSubmit = async data => {
    const { notes, ...rest } = data;
    const response = await api.post('labRequest', {
      ...rest,
      encounterId: encounter.id,
      labTest: {
        date: getCurrentDateString(),
      },
      note: {
        date: getCurrentDateTimeString(),
        content: notes,
      },
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
    setRequestFormType(step === 0 ? null : values.requestFormType);
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
        requestFormType={requestFormType}
        onClose={handleClose}
      />
    );
  }

  return (
    <StyledModal
      maxWidth="md"
      title={`New lab request${requestFormType ? ` | ${SECTION_TITLES[requestFormType]}` : ''}`}
      open={open}
      onClose={handleClose}
      minHeight={500}
    >
      {ModalBody}
    </StyledModal>
  );
});
