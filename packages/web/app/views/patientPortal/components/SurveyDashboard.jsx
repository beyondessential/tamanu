import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { Colors } from '../../../constants';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useApi } from '../../../api';

const DashboardContainer = styled.div`
  padding: 20px;
  margin-bottom: 20px;
  background-color: white;
`;

const CountText = styled(Typography)`
  font-size: 14px;
  margin-bottom: 16px;
  color: ${Colors.darkText};
`;

const SurveyListContainer = styled.div`
  border-top: 1px solid ${Colors.outline};
`;

const SurveyCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid ${Colors.outline};
  background-color: white;

  &:hover {
    background-color: ${Colors.background};
  }
`;

const SurveyTitle = styled(Typography)`
  font-size: 14px;
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-top: 4px;
  background-color: ${props =>
    props.status === 'Outstanding'
      ? 'rgba(255, 99, 71, 0.1)'
      : props.status === 'Completed'
      ? 'rgba(75, 181, 67, 0.1)'
      : 'transparent'};
  color: ${props =>
    props.status === 'Outstanding'
      ? Colors.alert
      : props.status === 'Completed'
      ? Colors.success
      : Colors.text};
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Colors.primary};
`;

// Mock API service that returns survey data
const useSurveys = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    // Simulate API call delay
    const timeoutId = setTimeout(() => {
      // Mock data - would normally come from an API call
      const mockSurveys = [
        {
          id: 'program-demncdprimaryscreening-cvdscreeningref',
          name: 'General pre-admission patient form',
          status: 'Outstanding',
        },
        {
          id: 'program-demncdprimaryscreening-cvdscreeningref',
          name: 'Existing condition pre-admission form',
          status: 'Completed',
        },
      ];

      setSurveys(mockSurveys);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [api]);

  return { surveys, loading };
};

export const SurveyDashboard = () => {
  const history = useHistory();
  const { surveys, loading } = useSurveys();

  const handleSurveyClick = surveyId => {
    history.push(`/patient-portal/surveys/${surveyId}`);
  };

  const outstandingSurveys = surveys.filter(survey => survey.status === 'Outstanding');

  if (loading) {
    return <DashboardContainer>Loading...</DashboardContainer>;
  }

  return (
    <DashboardContainer>
      {outstandingSurveys.length > 0 && (
        <CountText>
          You have {outstandingSurveys.length} outstanding{' '}
          {outstandingSurveys.length === 1 ? 'item' : 'items'} to complete
        </CountText>
      )}

      <SurveyListContainer>
        {surveys.map(survey => (
          <SurveyCard key={survey.id} onClick={() => handleSurveyClick(survey.id)}>
            <Box>
              <SurveyTitle>{survey.name}</SurveyTitle>
              <StatusBadge status={survey.status}>{survey.status}</StatusBadge>
            </Box>
            {survey.status === 'Outstanding' && (
              <IconWrapper>
                <ChevronRightIcon />
              </IconWrapper>
            )}
          </SurveyCard>
        ))}
      </SurveyListContainer>
    </DashboardContainer>
  );
};
