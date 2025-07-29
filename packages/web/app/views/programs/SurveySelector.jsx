import React, { useCallback } from 'react';
import styled from 'styled-components';

import { Button, TextButton } from '../../components/Button';
import { ButtonRow } from '../../components/ButtonRow';
import { SelectInput } from '../../components/Field/SelectField';
import { SendIcon } from '../../components/Icons/SendIcon';
import { TranslatedText } from '../../components/Translation/TranslatedText';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;
`;

const StyledTextButton = styled(TextButton)`
  text-transform: none;
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
      <SelectInput
        name="survey"
        options={surveys}
        value={value ?? ''}
        onChange={handleChange}
        data-testid="selectinput-4g3c"
      />
      <StyledButtonRow data-testid="styledbuttonrow-nem0">
        <StyledTextButton>
          <SendIcon width={12} height={12} style={{ marginRight: '0.25rem' }} />
          <TranslatedText
            stringId="program.modal.selectSurvey.action.sendToPatientPortal"
            fallback="Send to patient portal"
          />
        </StyledTextButton>
        <Button
          onClick={handleSubmit}
          disabled={!value}
          variant="contained"
          color="primary"
          data-testid="button-qsbg"
          style={{ marginLeft: 'auto' }}
        >
          {buttonText}
        </Button>
      </StyledButtonRow>
    </>
  );
});
