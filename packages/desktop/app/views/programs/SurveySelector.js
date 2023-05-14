import React, { useState, useCallback, useEffect } from 'react';

import { Button } from 'desktop/app/components/Button';
import { ButtonRow } from 'desktop/app/components/ButtonRow';

import { SelectInput } from 'desktop/app/components/Field/SelectField';

import styled from 'styled-components';

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

  useEffect(() => {
    if (!surveys) {
      setSelectedSurveyId(null);
    }
  }, [surveys]);

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
