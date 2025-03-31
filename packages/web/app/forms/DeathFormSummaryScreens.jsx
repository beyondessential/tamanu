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
      <OutlinedButton
        onClick={onStepBack || undefined}
        disabled={!onStepBack}
        data-testid='outlinedbutton-bngm'>
        <TranslatedText
          stringId="general.action.back"
          fallback="Back"
          data-testid='translatedtext-3nyc' />
      </OutlinedButton>
      <Box>
        <OutlinedButton onClick={onCancel} data-testid='outlinedbutton-k4kj'>Cancel</OutlinedButton>
        <Button
          color="primary"
          variant="contained"
          onClick={onContinue}
          data-testid='button-2xtd'>
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
        data-testid='translatedtext-wn0t' />
    }
    text={
      <>
        <TranslatedText
          stringId="death.summary.warning1.text"
          fallback="If this patient has an active encounter they will be auto-discharged. Please ensure that all encounter details are up-to-date and correct before proceeding."
          data-testid='translatedtext-jxpe' />
        <br />
        <br />
        <TranslatedText
          stringId="death.summary.save.text"
          fallback='The record of this patient’s death will be saved but not finalised. Please return at a later time or date to enter the complete cause of death details and finalise.'
          data-testid='translatedtext-ymy0' />
      </>
    }
    continueButtonText={<TranslatedText
      stringId="general.action.confirm"
      fallback="Confirm"
      data-testid='translatedtext-9dol' />}
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
        data-testid='translatedtext-fpbv' />
    }
    text={
      <TranslatedText
        stringId="death.summary.warning2.text"
        fallback="This action is irreversible. This should only be done under the direction of the responsible clinician. Do you wish to record the death of this patient?"
        data-testid='translatedtext-8x8y' />
    }
    continueButtonText={
      <TranslatedText
        stringId="death.action.recordDeath"
        fallback="Record death"
        data-testid='translatedtext-3b7a' />
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
        data-testid='translatedtext-fexb' />
    }
    text={
      <>
        <TranslatedText
          stringId="death.summary.warning1.text"
          fallback="If this patient has an active encounter they will be auto-discharged. Please ensure that all encounter details are up-to-date and correct before proceeding."
          data-testid='translatedtext-9daj' />
        <br />
        <br />
        <TranslatedText
          stringId="death.summary.warning2.text"
          fallback="This action is irreversible. This should only be done under the direction of the responsible clinician. Do you wish to record the death of this patient?"
          data-testid='translatedtext-q507' />
      </>
    }
    continueButtonText={
      <TranslatedText
        stringId="death.action.recordDeath"
        fallback="Record death"
        data-testid='translatedtext-na9x' />
    }
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
  />
);
