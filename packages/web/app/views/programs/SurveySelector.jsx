import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { SelectInput, Button, TextButton, ButtonRow } from '@tamanu/ui-components';
import { SendFormToPatientPortalModal } from '../patients/components/SendFormToPatientPortalModal';
import { TranslatedText } from '../../components';
import { SendIcon } from '../../components/Icons/SendIcon';
import { useSettings } from '../../contexts/Settings';
import { useAuth } from '../../contexts/Auth.jsx';

const StyledButtonRow = styled(ButtonRow)`
  margin-top: 24px;

  button {
    text-transform: none;
  }

  svg {
    margin-right: 4px;
  }
`;

const SendFormToPatientPortalModalButton = ({ setOpen, isDisabled }) => {
  const { ability } = useAuth();
  const { getSetting } = useSettings();
  const isPatientPortalEnabled = getSetting('features.patientPortal');
  const isDeceased = useSelector(state => Boolean(state.patient?.dateOfDeath));
  const canAssignPortalForm = ability?.can('create', 'PatientPortalForm');

  if (!isPatientPortalEnabled || !canAssignPortalForm || isDeceased) {
    return null;
  }

  return (
    <TextButton onClick={() => setOpen(true)} disabled={isDisabled}>
      <SendIcon width={12} height={12} />
      <TranslatedText
        stringId="program.action.sendToPatientPortal"
        fallback="Send to patient portal"
      />
    </TextButton>
  );
};

export const SurveySelector = React.memo(({ value, onChange, onSubmit, surveys, buttonText }) => {
  const [open, setOpen] = useState(false);

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
        <SendFormToPatientPortalModalButton setOpen={setOpen} isDisabled={!value} />
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
