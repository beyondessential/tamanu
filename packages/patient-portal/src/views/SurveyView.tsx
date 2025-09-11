/* eslint-disable @typescript-eslint/no-unused-vars */
//@ts-nocheck
import React from 'react';
import { Card } from '@components/Card';
import { useCurrentUser } from '@routes/PrivateRoute';
import { SurveyForm } from '@features/survey/SurveyForm';
import { ENCOUNTER_TYPES } from '@tamanu/constants';

export const SurveyView = () => {
  const patient = useCurrentUser();
  const currentUser = {};
  const survey = {};
  const patientAdditionalData = {};
  const encounterType = ENCOUNTER_TYPES.CLINIC;
  console.log('patientAdditionalData?', patient);

  return (
    <Card sx={{ width: '425px' }}>
      <SurveyForm patient={patient} currentUser={currentUser} survey={survey} />
    </Card>
  );
};
