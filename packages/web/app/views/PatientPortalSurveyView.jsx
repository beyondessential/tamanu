import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { useApi } from '../api';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ErrorMessage } from '../components/ErrorMessage';
import { TranslatedText } from '../components/Translation';
import { getAnswersFromData } from '../utils';
import { SurveyView } from './programs/SurveyView';
import styled from 'styled-components';

const StyledSurveyView = styled(SurveyView)`
  .MuiButton-root {
    width: 100%;
    margin-top: 24px;
    padding: 12px;
  }
`;

export const PatientPortalSurveyView = () => {
  const api = useApi();
  const { surveyId } = useParams();
  const [startTime] = useState(getCurrentDateTimeString());

  // Load the survey
  const { data: survey, isLoading, isError, error } = useQuery(
    ['survey', surveyId],
    () => api.get(`survey/${surveyId}`),
    {
      enabled: !!surveyId,
    }
  );

  const submitSurveyResponse = async (data) => {
    try {
      await api.post('surveyResponse', {
        surveyId: survey.id,
        startTime,
        endTime: getCurrentDateTimeString(),
        answers: getAnswersFromData(data, survey),
      });
      // Handle successful submission - you can add navigation or success message here
    } catch (err) {
      // Handle error - you can show an error message
      console.error('Error submitting survey:', err);
    }
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (isError) {
    return (
      <ErrorMessage
        title={<TranslatedText stringId="survey.error.title" fallback="Error" />}
        error={error}
      />
    );
  }

  return (
    <StyledSurveyView
      survey={survey}
      onSubmit={submitSurveyResponse}
      onCancel={() => {}} // Add proper cancel handling if needed
    />
  );
};
