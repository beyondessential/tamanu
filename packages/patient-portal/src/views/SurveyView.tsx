import React from 'react';
import { styled, Typography, Box } from '@mui/material';
import { useCurrentUser } from '@routes/PrivateRoute';
import { SurveyForm } from '../features/survey/SurveyForm';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { useSurveyQuery } from '@api/queries/useSurveyQuery';

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

const surveyId = 'program-demendoscopyscreen-demendoref';

export const SurveyView = () => {
  const { isPending, data: survey } = useSurveyQuery(surveyId);
  const patient = useCurrentUser();
  const currentUser = {};
  const patientAdditionalData = {};
  const encounterType = ENCOUNTER_TYPES.CLINIC;
  console.log('patientAdditionalData?', patient);

  const onSubmit = async () => {};
  const onCancel = async () => {};

  if (isPending || !survey) {
    return 'loading...';
  }

  return (
    <Container>
      <Header sx={{ p: 2 }}>
        <Title variant="h2">{survey.name}</Title>
      </Header>
      <Box sx={{ p: 2 }}>
        <SurveyForm
          patientAdditionalData={patientAdditionalData}
          encounterType={encounterType}
          patient={patient}
          currentUser={currentUser}
          survey={survey}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </Box>
    </Container>
  );
};
