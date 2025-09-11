/* eslint-disable @typescript-eslint/no-unused-vars */
//@ts-nocheck
import React from 'react';
import { styled } from '@mui/material/styles';
import { useCurrentUser } from '@routes/PrivateRoute';
import { SurveyForm } from '@features/survey/SurveyForm';
import { ENCOUNTER_TYPES } from '@tamanu/constants';
import { useSurveyQuery } from '@api/queries/useSurveyQuery';

const Container = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: 20,
  borderRadius: 3,
  width: 720,
  maxWidth: '100%',
  margin: '30px auto',
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

  if (isPending) {
    return 'loading...';
  }

  return (
    <Container>
      <SurveyForm patient={patient} currentUser={currentUser} survey={survey} onSubmit={onSubmit} />
    </Container>
  );
};
