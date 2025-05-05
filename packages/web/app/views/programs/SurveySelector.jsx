import React, { useCallback } from 'react';
import styled from 'styled-components';

import { Button } from '../../components/Button';
import { ButtonRow } from '../../components/ButtonRow';
import { SelectInput } from '../../components/Field/SelectField';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

export const SurveySelector = React.memo(
  ({ value, onChange, onSubmit, onAssign, surveys, buttonText }) => {
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

    const handleAssign = useCallback(() => {
      onAssign(value);
    }, [onAssign, value]);

    return (
      <>
        <SelectInput name="survey" options={surveys} value={value ?? ''} onChange={handleChange} />
        <StyledButtonRow>
          <Button onClick={handleAssign} disabled={!value} variant="contained" color="primary">
            Assign to patient
          </Button>
          <Button onClick={handleSubmit} disabled={!value} variant="contained" color="primary">
            {buttonText}
          </Button>
        </StyledButtonRow>
      </>
    );
  },
);
