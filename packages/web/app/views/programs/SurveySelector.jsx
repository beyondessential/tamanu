import React, { useCallback } from 'react';
import styled from 'styled-components';

import { Button } from '../../components/Button';
import { ButtonRow } from '../../components/ButtonRow';
import { SelectInput } from '../../components/Field/SelectField';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

export const SurveySelector = React.memo(({ value, onChange, onSubmit, surveys, buttonText }) => {
  const handleChange = useCallback(
    (event) => {
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
      <SelectInput
        name="survey"
        options={surveys}
        value={value ?? ''}
        onChange={handleChange}
        data-testid="selectinput-4g3c"
      />
      <StyledButtonRow data-testid="styledbuttonrow-nem0">
        <Button
          onClick={handleSubmit}
          disabled={!value}
          variant="contained"
          color="primary"
          data-testid="button-qsbg"
        >
          {buttonText}
        </Button>
      </StyledButtonRow>
    </>
  );
});
