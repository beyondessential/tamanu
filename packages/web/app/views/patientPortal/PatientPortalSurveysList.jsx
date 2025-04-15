import React from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { TranslatedText } from '../../components/Translation';
import { Colors } from '../../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${Colors.background};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid ${Colors.outline};
  background-color: white;
`;

const Title = styled.h1`
  font-size: 18px;
  font-weight: 500;
  margin: 0;
`;

const ContentContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: white;
`;

const SurveyCard = styled.div`
  padding: 16px;
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  margin-bottom: 12px;
  cursor: pointer;

  &:hover {
    background-color: ${Colors.background};
  }
`;

const SurveyTitle = styled.h2`
  font-size: 16px;
  margin: 0 0 8px 0;
`;

const SurveyDescription = styled.p`
  margin: 0;
  color: ${Colors.darkText};
`;

export const PatientPortalSurveysList = () => {
  const history = useHistory();

  // This would be replaced with real data from an API call
  const mockSurveys = [
    {
      id: 'survey1',
      name: 'General pre-admission patient form',
      description: 'Please complete this form before your admission',
    },
    {
      id: 'survey2',
      name: 'Medication history',
      description: 'Please provide information about your current medications',
    },
    {
      id: 'survey3',
      name: 'Medical history',
      description: 'Please provide information about your medical history',
    },
  ];

  const handleSurveyClick = surveyId => {
    history.push(`/patient-portal/surveys/${surveyId}`);
  };

  return (
    <Container>
      <Header>
        <Title>
          <TranslatedText stringId="patientPortal.surveys.title" fallback="Your forms" />
        </Title>
      </Header>

      <ContentContainer>
        {mockSurveys.map(survey => (
          <SurveyCard key={survey.id} onClick={() => handleSurveyClick(survey.id)}>
            <SurveyTitle>{survey.name}</SurveyTitle>
            <SurveyDescription>{survey.description}</SurveyDescription>
          </SurveyCard>
        ))}
      </ContentContainer>
    </Container>
  );
};
