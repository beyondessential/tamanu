import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { styled, Typography, Box } from '@mui/material';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { type User } from '@tamanu/shared/schemas/patientPortal';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { getAnswersFromData } from '@tamanu/ui-components';
import { useCurrentUser } from '@routes/PrivateRoute';
import { useSurveyQuery } from '@api/queries/useSurveyQuery';
import { useSubmitSurveyResponse } from '@api/mutations';
import { SurveyForm } from '../features/survey/SurveyForm';

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

type SurveyData = Record<string, any>;

export const SurveyView = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [startTime, setStartTime] = useState<string | null>(null);
  const { isPending, data: survey } = useSurveyQuery(surveyId);
  const { mutate: submitSurveyResponse } = useSubmitSurveyResponse();
  const { additionalData, ...patient } = useCurrentUser();
  const currentUser = {} as User;
  const encounterType = ENCOUNTER_TYPES.CLINIC;

  useEffect(() => {
    setStartTime(getCurrentDateTimeString());
  }, []);

  const onSubmit = async (data: SurveyData) => {
    submitSurveyResponse({
      surveyId,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTimeString(),
      answers: (await getAnswersFromData(data, survey)) as SurveyData,
      facilityId: '',
    });
  };
  const onCancel = async () => {};

  if (isPending || !survey) {
    return null;
  }

  return (
    <Container>
      <Header p={2}>
        <Title variant="h2">{survey.name}</Title>
      </Header>
      <Box p={2}>
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
