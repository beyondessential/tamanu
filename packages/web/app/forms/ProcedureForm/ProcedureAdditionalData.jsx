import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import styled from 'styled-components';
import Typography from '@mui/material/Typography';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import MuiDivider from '@mui/material/Divider';
import { SelectInput, TranslatedText } from '../../components';
import { useApi } from '../../api';
import { SurveyViewForm } from '../../views/programs/SurveyView';
import { useAuth } from '../../contexts/Auth';
import { usePatientAdditionalDataQuery, useSurveyQuery } from '../../api/queries';
import { getAnswersFromData } from '../../utils';
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

const Divider = styled(MuiDivider)`
  margin: 10px 0 20px;
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
  selectedSurveyId,
  setSelectedSurveyId,
  onSuccess,
}) => {
  const api = useApi();
  const { currentUser, facilityId } = useAuth();
  const [cancelFormModalOpen, setCancelFormModalOpen] = useState(false);
  const [startTime] = useState(getCurrentDateTimeString());
  const [surveyFormDirty, setSurveyFormDirty] = useState(false);
  const [pendingSelectedSurveyId, setPendingSelectedSurveyId] = useState(null);

  const surveys = useProcedureSurveys(procedureTypeId);
  const { data: patientAdditionalData } = usePatientAdditionalDataQuery(patient.id);
  const { data: survey } = useSurveyQuery(selectedSurveyId);

  const { mutateAsync: submitSurveyResponse } = useMutation(
    async body => {
      return api.post('procedure/surveyResponse', {
        surveyId: survey.id,
        startTime,
        patientId: patient.id,
        facilityId,
        endTime: getCurrentDateTimeString(),
        answers: await getAnswersFromData(body, survey),
        procedureId,
      });
    },
    {
      onSuccess: data => {
        onSuccess(data.procedureId);
        setSelectedSurveyId(null);
        setSurveyFormDirty(false);
      },
    },
  );

  const onFormSelect = event => {
    const newSurveyId = event.target.value;
    if (surveyFormDirty) {
      setPendingSelectedSurveyId(newSurveyId);
      setCancelFormModalOpen(true);
    } else {
      setSelectedSurveyId(newSurveyId);
    }
  };

  const onCancel = () => {
    if (surveyFormDirty) {
      setPendingSelectedSurveyId(null);
      setCancelFormModalOpen(true);
    } else {
      setSelectedSurveyId(null);
    }
  };

  const hasAdditionalDataForms = surveys?.length > 0;

  if (!hasAdditionalDataForms) {
    return null;
  }

  return (
    <>
      <Container>
        <Heading>
          <TranslatedText
            stringId="procedure.form.additionalDataHeading"
            fallback="Additional data"
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
            <SurveyViewForm
              key={survey.id}
              onSubmit={submitSurveyResponse}
              survey={survey}
              onCancel={onCancel}
              patient={patient}
              patientAdditionalData={patientAdditionalData}
              currentUser={currentUser}
              showCancelButton
              onFormDirtyChange={setSurveyFormDirty}
            />
          </SurveyBox>
        )}
      </Container>
      <Divider />
      <CancelAdditionalDataModal
        open={cancelFormModalOpen}
        onCancel={() => {
          setCancelFormModalOpen(false);
          setPendingSelectedSurveyId(null);
        }}
        onConfirm={() => {
          setCancelFormModalOpen(false);
          // If there's a pending survey selection, apply it; otherwise clear the current selection
          setSelectedSurveyId(pendingSelectedSurveyId);
          setPendingSelectedSurveyId(null);
          setSurveyFormDirty(false);
        }}
      />
    </>
  );
};
