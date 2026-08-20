import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import styled from 'styled-components';
import { combineQueries, useApi, useSuggester } from '../api';
import { useDateTime } from '@tamanu/ui-components';
import { FormModal } from './FormModal';
import { LabRequestMultiStepForm } from '../forms/LabRequestForm/LabRequestMultiStepForm';
import { LabRequestSummaryPane } from '../views/patients/components/LabRequestSummaryPane';
import { useEncounter } from '../contexts/Encounter';
import { TranslatedText } from './Translation/TranslatedText';

const StyledModal = styled(FormModal)`
  .MuiDialog-paper {
    max-width: 1200px;
  }
`;

const useLabRequestsQuery = labRequestIds => {
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
  return combineQueries(queries, { filterNoData: true });
};

export const LabRequestModal = React.memo(({ open, onClose, encounter }) => {
  const [newLabRequestIds, setNewLabRequestIds] = useState([]);
  const { getCurrentDate, getCurrentDateTime } = useDateTime();
  const api = useApi();
  const { loadEncounter } = useEncounter();
  const { isSuccess, isLoading, data: newLabRequests } = useLabRequestsQuery(newLabRequestIds);
  const practitionerSuggester = useSuggester('practitioner');
  const specimenTypeSuggester = useSuggester('specimenType');
  const labSampleSiteSuggester = useSuggester('labSampleSite');
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });

  const handleSubmit = async data => {
    const { notes, ...rest } = data;
    const response = await api.post('labRequest', {
      ...rest,
      encounterId: encounter.id,
      labTest: {
        date: getCurrentDate(),
      },
      note: {
        date: getCurrentDateTime(),
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

  let ModalBody = (
    <LabRequestMultiStepForm
      isSubmitting={isLoading}
      onSubmit={handleSubmit}
      onCancel={handleClose}
      encounter={encounter}
      practitionerSuggester={practitionerSuggester}
      departmentSuggester={departmentSuggester}
      specimenTypeSuggester={specimenTypeSuggester}
      labSampleSiteSuggester={labSampleSiteSuggester}
      data-testid="labrequestmultistepform-4yb0"
    />
  );

  if (isSuccess) {
    ModalBody = (
      <LabRequestSummaryPane
        encounter={encounter}
        labRequests={newLabRequests}
        onClose={handleClose}
        data-testid="labrequestsummarypane-uhfv"
      />
    );
  }

  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="lab.modal.create.title"
          fallback="New lab request"
          data-testid="translatedtext-2ldh"
        />
      }
      open={open}
      onClose={handleClose}
      minHeight={800}
      data-testid="styledmodal-bqm5"
    >
      {ModalBody}
    </StyledModal>
  );
});
