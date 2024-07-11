import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { Button, FormGrid, OutlinedButton } from '../components';
import { TranslatedText } from '../components/Translation/TranslatedText';

const Actions = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;

  button ~ button {
    margin-left: 12px;
  }
`;

const RedHeading = styled(Typography)`
  font-size: 18px;
  line-height: 21px;
  font-weight: 500;
  color: ${props => props.theme.palette.error.main};
`;

const Text = styled(Typography)`
  font-size: 15px;
  line-height: 21px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
  margin-bottom: 48px;
  white-space: pre-line;
`;

const BaseSummaryScreen = ({
  heading,
  text,
  onStepBack,
  onCancel,
  onContinue,
  continueButtonText,
}) => (
  <FormGrid columns={1}>
    <RedHeading>{heading}</RedHeading>
    <Text>{text}</Text>
    <Actions>
      <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
        <TranslatedText stringId="general.action.back" fallback="Back" />
      </OutlinedButton>
      <Box>
        <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
        <Button color="primary" variant="contained" onClick={onContinue}>
          {continueButtonText}
        </Button>
      </Box>
    </Actions>
  </FormGrid>
);

export const SummaryScreenOne = ({ onStepBack, submitForm, onCancel }) => (
  <BaseSummaryScreen
    heading={
      <TranslatedText
        stringId="death.summary.autoDischargedAndLocked.text"
        fallback="Patient will be auto-discharged and locked"
      />
    }
    text={
      <>
        <TranslatedText
          stringId="death.summary.warning1.text"
          fallback="If this patient has an active encounter they will be auto-discharged. Please ensure that all encounter details are up-to-date and correct before proceeding."
        />
        <br />
        <br />
        <TranslatedText
          stringId="death.summary.save.text"
          fallback="The record of this patient's death will be saved but not finalised. Please return at a later time or date to enter the complete cause of death details and finalise."
        />
      </>
    }
    continueButtonText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
  />
);

export const SummaryScreenTwo = ({ onStepBack, submitForm, onCancel }) => (
  <BaseSummaryScreen
    heading={
      <TranslatedText
        stringId="death.summary.confirmDeathRecord.text"
        fallback="Confirm death record"
      />
    }
    text={
      <TranslatedText
        stringId="death.summary.warning2.text"
        fallback="This action is irreversible. This should only be done under the direction of the responsible clinician. Do you wish to record the death of this patient?"
      />
    }
    continueButtonText={
      <TranslatedText stringId="death.action.recordDeath" fallback="Record death" />
    }
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
  />
);

export const SummaryScreenThree = ({ onStepBack, submitForm, onCancel }) => (
  <BaseSummaryScreen
    heading={
      <TranslatedText
        stringId="death.summary.confirmDeathRecord.text"
        fallback="Confirm death record"
      />
    }
    text={
      <>
        <TranslatedText
          stringId="death.summary.warning1.text"
          fallback="If this patient has an active encounter they will be auto-discharged. Please ensure that all encounter details are up-to-date and correct before proceeding."
        />
        <br />
        <br />
        <TranslatedText
          stringId="death.summary.warning2.text"
          fallback="This action is irreversible. This should only be done under the direction of the responsible clinician. Do you wish to record the death of this patient?"
        />
      </>
    }
    continueButtonText={
      <TranslatedText stringId="death.action.recordDeath" fallback="Record death" />
    }
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
  />
);
