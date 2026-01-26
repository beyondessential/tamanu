import React, { useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import styled from 'styled-components';
import { combineQueries, useApi, useSuggester } from '../api';
import { useDateTimeFormat } from '@tamanu/ui-components';
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

const SECTION_TITLES = {
  [LAB_REQUEST_FORM_TYPES.INDIVIDUAL]: 'Individual',
  [LAB_REQUEST_FORM_TYPES.PANEL]: 'Panel',
};

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
  const [requestFormType, setRequestFormType] = useState(null);
  const [newLabRequestIds, setNewLabRequestIds] = useState([]);
  const { getCountryCurrentDateString, getCountryCurrentDateTimeString } = useDateTimeFormat();
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
        date: getCountryCurrentDateString(),
      },
      note: {
        date: getCountryCurrentDateTimeString(),
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

    setRequestFormType(null);
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
        requestFormType={requestFormType}
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
          fallback="New lab request :modalSectionTitle"
          replacements={{
            modalSectionTitle: requestFormType ? `| ${SECTION_TITLES[requestFormType]}` : ' ',
          }}
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
