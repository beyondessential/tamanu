import React, { useState, useCallback } from 'react';

import styled from 'styled-components';
import { Button } from '../../components/Button';
import { ButtonRow } from '../../components/ButtonRow';

import { SelectInput } from '../../components/Field/SelectField';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

export const SurveySelector = React.memo(({ onSelectSurvey, surveys, buttonText }) => {
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);

  const onChangeSurvey = useCallback(event => {
    const surveyId = event.target.value;
    setSelectedSurveyId(surveyId);
  }, []);

  const onSubmit = useCallback(() => {
    onSelectSurvey(selectedSurveyId);
  }, [onSelectSurvey, selectedSurveyId]);

  return (
    <>
      <SelectInput options={surveys} value={selectedSurveyId} onChange={onChangeSurvey} />
      <StyledButtonRow>
        <Button onClick={onSubmit} disabled={!selectedSurveyId} variant="contained" color="primary">
          {buttonText}
        </Button>
      </StyledButtonRow>
    </>
  );
});
