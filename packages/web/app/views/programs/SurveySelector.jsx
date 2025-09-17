import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Button, TextButton } from '../../components/Button';
import { ButtonRow } from '../../components/ButtonRow';
import { SelectInput } from '../../components/Field/SelectField';
import { SendFormToPatientPortalModal } from '../patients/components/SendFormToPatientPortalModal';
import { TranslatedText } from '../../components';
import { SendIcon } from '../../components/Icons/SendIcon';
import { useSettings } from '../../contexts/Settings';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;

  button {
    text-transform: none;
  }

  svg {
    margin-right: 4px;
  }
`;

export const SurveySelector = React.memo(({ value, onChange, onSubmit, surveys, buttonText }) => {
  const [open, setOpen] = useState(false);
  const { getSetting } = useSettings();
  const isPatientPortalEnabled = getSetting('features.patientPortal');
  const patient = useSelector(state => state.patient);
  const isDeceased = Boolean(patient?.dateOfDeath);

  const handleChange = event => {
    const surveyId = event.target.value;
    onChange(surveyId);
  };

  const handleSubmit = () => {
    onSubmit(value);
  };

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
        {isPatientPortalEnabled && !isDeceased && (
          <TextButton onClick={() => setOpen(true)} disabled={!value}>
            <SendIcon width={12} height={12} />
            <TranslatedText
              stringId="program.action.sendToPatientPortal"
              fallback="Send to patient portal"
            />
          </TextButton>
        )}

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
      <SendFormToPatientPortalModal formId={value} open={open} setOpen={setOpen} />
    </>
  );
});
