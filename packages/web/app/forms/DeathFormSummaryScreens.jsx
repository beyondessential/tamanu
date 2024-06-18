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

const TEXT_COPY_ONE = (
  <TranslatedText
    stringId="death.summary.warning1.text"
    fallback="If this patient has an active encounter they will be auto-discharged. Please ensure that all encounter details are up-to-date and correct before proceeding."
  />
);
const TEXT_COPY_TWO = (
  <TranslatedText
    stringId="death.summary.save.text"
    fallback="The record of this patient's death will be saved but not finalised. Please return at a later time or date to enter the complete cause of death details and finalise."
  />
);
const TEXT_COPY_THREE = (
  <TranslatedText
    stringId="death.summary.warning2.text"
    fallback="This action is irreversible. This should only be done under the direction of the responsible clinician. Do you wish to record the death of this patient?"
  />
);
const CONFIRM_MESSAGE_ONE = (
  <TranslatedText
    stringId="death.summary.confirm1.text"
    fallback=":textOne \n\n :textTwo"
    replacements={{ textOne: TEXT_COPY_ONE, textTwo: TEXT_COPY_TWO }}
  />
);
const CONFIRM_MESSAGE_TWO = TEXT_COPY_THREE;
const CONFIRM_MESSAGE_THREE = (
  <TranslatedText
    stringId="death.summary.confirm3.text"
    fallback=":textOne \n\n :textThree"
    replacements={{ textOne: TEXT_COPY_ONE, textThree: TEXT_COPY_THREE }}
  />
);

export const SummaryScreenOne = ({ onStepBack, submitForm, onCancel }) => (
  <BaseSummaryScreen
    heading={
      <TranslatedText
        stringId="death.summary.autoDischargedAndLocked.text"
        fallback="Patient will be auto-discharged and locked"
      />
    }
    text={CONFIRM_MESSAGE_ONE}
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
    text={CONFIRM_MESSAGE_TWO}
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
    text={CONFIRM_MESSAGE_THREE}
    continueButtonText={
      <TranslatedText stringId="death.action.recordDeath" fallback="Record death" />
    }
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
  />
);
