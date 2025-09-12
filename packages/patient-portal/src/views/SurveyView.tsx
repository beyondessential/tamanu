import React from 'react';
import { useParams } from 'react-router-dom';
import { styled, Typography, Box } from '@mui/material';
import { useCurrentUser } from '@routes/PrivateRoute';
import { SurveyForm } from '../features/survey/SurveyForm';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { useSurveyQuery } from '@api/queries/useSurveyQuery';
import { type User } from '@tamanu/shared/schemas/patientPortal';

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

export const SurveyView = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { isPending, data: survey } = useSurveyQuery(surveyId);
  const { additionalData, ...patient } = useCurrentUser();
  const currentUser = {} as User;
  const encounterType = ENCOUNTER_TYPES.CLINIC;

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
          patientAdditionalData={additionalData}
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
