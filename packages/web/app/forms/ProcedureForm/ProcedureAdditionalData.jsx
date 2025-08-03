import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import styled from 'styled-components';
import Typography from '@material-ui/core/Typography';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { SelectInput, TranslatedReferenceData, TranslatedText } from '../../components';
import { useApi } from '../../api';
import { SurveyViewForm } from '../../views/programs/SurveyView';
import { useAuth } from '../../contexts/Auth';
import { usePatientAdditionalDataQuery, useSurveyQuery } from '../../api/queries';
import { getAnswersFromData, notifyError } from '../../utils';
import { Colors } from '../../constants';
import { CancelAdditionalDataModal } from './ProcedureFormModals';

const Container = styled.div`
  margin-bottom: 1.5rem;
`;

const Heading = styled(Typography)`
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  margin-bottom: 10px;
`;

const LeadText = styled(Typography)`
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 18px;
  margin-bottom: 10px;
  color: ${props => props.theme.palette.text.tertiary};
`;

const SurveyBox = styled.div`
  background: ${Colors.white};
  padding: 20px;
  margin: 20px 0;
  border-radius: 3px;
  border: 1px solid ${Colors.outline};
`;

const SurveyHeading = styled(Typography)`
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 10px;
`;

const useProcedureSurveys = procedureTypeId => {
  const api = useApi();
  const { data } = useQuery(
    ['survey', 'procedure', procedureTypeId],
    () => api.get(`survey/procedureType/${procedureTypeId}`),
    { enabled: !!procedureTypeId },
  );
  return data?.map(survey => ({ label: survey.name, value: survey.id }));
};

export const ProcedureAdditionalData = ({
  patient,
  procedureId,
  procedureTypeId,
  updateRefreshCount,
  selectedSurveyId,
  setSelectedSurveyId,
}) => {
  const api = useApi();
  const { currentUser, facilityId } = useAuth();
  const [unSavedChangesModalOpen, setUnSavedChangesModalOpen] = useState(false);
  const surveys = useProcedureSurveys(procedureTypeId);
  const [startTime] = useState(getCurrentDateTimeString());
  const { data: patientAdditionalData } = usePatientAdditionalDataQuery(patient.id);
  const { data: survey } = useSurveyQuery(selectedSurveyId);

  const { mutate: submitSurveyResponse } = useMutation({
    mutationFn: async body => {
      return api.post('procedure/surveyResponse', {
        surveyId: survey.id,
        startTime,
        patientId: patient.id,
        facilityId,
        endTime: getCurrentDateTimeString(),
        answers: getAnswersFromData(body, survey),
        procedureId,
      });
    },
    onError: error => notifyError(error.message),
    onSuccess: () => {
      updateRefreshCount();
      setSelectedSurveyId(null);
    },
  });

  const onFormSelect = event => {
    setSelectedSurveyId(event.target.value);
  };

  const onCancel = () => {
    setUnSavedChangesModalOpen(true);
  };

  return (
    <>
      <Container>
        <Heading>
          <TranslatedText
            stringId="procedure.form.additionalDataHeading"
            fallback=" Additional data"
          />
        </Heading>
        <LeadText>
          <TranslatedText
            stringId="procedure.form.additionalDataText"
            fallback="Add any additional data to the procedure record by selecting a form below."
          />
        </LeadText>
        <SelectInput
          name="survey"
          label={
            <TranslatedText
              stringId="procedure.form.additionalDataForm.label"
              fallback="Select form"
            />
          }
          options={surveys}
          value={selectedSurveyId ?? ''}
          onChange={onFormSelect}
        />
        {survey && (
          <SurveyBox>
            <SurveyHeading variant="h6" data-testid="surveypaneheading-b5sc">
              <TranslatedReferenceData category="survey" value={survey.id} fallback={survey.name} />
            </SurveyHeading>
            <SurveyViewForm
              onSubmit={submitSurveyResponse}
              survey={survey}
              onCancel={onCancel}
              patient={patient}
              patientAdditionalData={patientAdditionalData}
              currentUser={currentUser}
              showCancelButton
            />
          </SurveyBox>
        )}
      </Container>
      <CancelAdditionalDataModal
        open={unSavedChangesModalOpen}
        onCancel={() => {
          setUnSavedChangesModalOpen(false);
        }}
        onConfirm={() => {
          setUnSavedChangesModalOpen(false);
          setSelectedSurveyId(null);
        }}
      />
    </>
  );
};
