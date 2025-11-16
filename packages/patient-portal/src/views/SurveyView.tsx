import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { styled, Typography, Box } from '@mui/material';
import { Alert } from '@material-ui/lab';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { getAnswersFromData, AuthContext } from '@tamanu/ui-components';
import { useCurrentUser } from '@routes/PrivateRoute';
import { useSurveyQuery } from '@api/queries/useSurveyQuery';
import { useSubmitSurveyResponse } from '@api/mutations';
import { SurveyForm } from '../features/survey/SurveyForm';
import { StyledCircularProgress } from '@components/StyledCircularProgress';
import { SettingsProvider } from '../contexts';

const Container = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: 3,
  width: 720,
  maxWidth: '100%',
  margin: '20px auto',
  border: `1px solid ${theme.palette.divider}`,
}));

const Header = styled(Box)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const Title = styled(Typography)(() => ({
  fontSize: 16,
  fontWeight: 500,
  lineHeight: 2,
}));

const ErrorAlert = styled(Alert)(() => ({
  width: 400,
  maxWidth: '90%',
  margin: '40px auto 0',
}));

type SurveyData = Record<string, any>;

export const SurveyView = () => {
  const { surveyId } = useParams() as { surveyId: string };
  const [startTime] = useState<string>(getCurrentDateTimeString());
  const { isPending, data: survey } = useSurveyQuery(surveyId);
  const { mutate: submitSurveyResponse } = useSubmitSurveyResponse();
  const { additionalData, ...patient } = useCurrentUser();
  const navigate = useNavigate();
  const encounterType = ENCOUNTER_TYPES.CLINIC;

  const onSubmit = async (data: SurveyData) => {
    submitSurveyResponse({
      surveyId,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTimeString(),
      answers: (await getAnswersFromData(data, survey)) as SurveyData,
    });
  };
  const onCancel = async () => {
    navigate('/');
  };

  if (isPending) {
    return <StyledCircularProgress />;
  }

  if (!survey || !survey.portalSurveyAssignment) {
    return (
      <ErrorAlert severity="error">
        There was an error loading the survey. Please try again or contact support if the problem
        persists.
      </ErrorAlert>
    );
  }

  /**
   * The facilityId is captured from the facility where the survey was assigned. Provided to
   * the survey in the portal for suggesters to filter data correctly.
   */
  const { facilityId } = survey.portalSurveyAssignment;

  return (
    <Container>
      <Header p={2}>
        <Title variant="h2">{survey.name}</Title>
      </Header>
      <Box p={2}>
        <AuthContext.Provider value={{ facilityId }}>
          <SettingsProvider facilityId={facilityId}>
            <SurveyForm
              patientAdditionalData={additionalData}
              encounterType={encounterType}
              patient={patient}
              survey={survey}
              onSubmit={onSubmit}
              onCancel={onCancel}
            />
          </SettingsProvider>
        </AuthContext.Provider>
      </Box>
    </Container>
  );
};
