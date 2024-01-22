import React, { useCallback } from 'react';

import { Button } from 'desktop/app/components/Button';
import { ButtonRow } from 'desktop/app/components/ButtonRow';

import { SelectInput } from 'desktop/app/components/Field/SelectField';

import styled from 'styled-components';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

export const SurveySelector = React.memo(({ value, onChange, onSubmit, surveys, buttonText }) => {
  const handleChange = useCallback(
    event => {
      const surveyId = event.target.value;
      onChange(surveyId);
    },
    [onChange],
  );

  const handleSubmit = useCallback(() => {
    onSubmit(value);
  }, [onSubmit, value]);

  return (
    <>
      <SelectInput options={surveys} value={value} onChange={handleChange} />
      <StyledButtonRow>
        <Button onClick={handleSubmit} disabled={!value} variant="contained" color="primary">
          {buttonText}
        </Button>
      </StyledButtonRow>
    </>
  );
});
