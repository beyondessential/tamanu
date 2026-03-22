import React from 'react';
import styled from 'styled-components';
import { Box, Typography } from '@material-ui/core';
import { Button, FormGrid, OutlinedButton } from '@tamanu/ui-components';
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
  font-size: 16px;
  line-height: 21px;
  font-weight: 500;
  color: ${(props) => props.theme.palette.error.main};
`;

const Text = styled(Typography)`
  font-size: 14px;
  line-height: 21px;
  font-weight: 400;
  color: ${(props) => props.theme.palette.text.secondary};
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
  <FormGrid columns={1} data-testid="formgrid-sjja">
    <RedHeading data-testid="redheading-zwa4">{heading}</RedHeading>
    <Text data-testid="text-9xej">{text}</Text>
    <Actions data-testid="actions-kb95">
      <OutlinedButton
        onClick={onStepBack || undefined}
        disabled={!onStepBack}
        data-testid="outlinedbutton-w7ud"
      >
        <TranslatedText
          stringId="general.action.back"
          fallback="Back"
          data-testid="translatedtext-v1zu"
        />
      </OutlinedButton>
      <Box data-testid="box-gycr">
        <OutlinedButton onClick={onCancel} data-testid="outlinedbutton-1lfy">
          Cancel
        </OutlinedButton>
        <Button color="primary" variant="contained" onClick={onContinue} data-testid="button-2g84">
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
        data-testid="translatedtext-59q1"
      />
    }
    text={
      <>
        <TranslatedText
          stringId="death.summary.warning1.text"
          fallback="If this patient has an active encounter they will be auto-discharged. Please ensure that all encounter details are up-to-date and correct before proceeding."
          data-testid="translatedtext-0tc4"
        />
        <br />
        <br />
        <TranslatedText
          stringId="death.summary.save.text"
          fallback="The record of this patient’s death will be saved but not finalised. Please return at a later time or date to enter the complete cause of death details and finalise."
          data-testid="translatedtext-44c8"
        />
      </>
    }
    continueButtonText={
      <TranslatedText
        stringId="general.action.confirm"
        fallback="Confirm"
        data-testid="translatedtext-6b4r"
      />
    }
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
    data-testid="basesummaryscreen-jxf1"
  />
);

export const SummaryScreenTwo = ({ onStepBack, submitForm, onCancel }) => (
  <BaseSummaryScreen
    heading={
      <TranslatedText
        stringId="death.summary.confirmDeathRecord.text"
        fallback="Confirm death record"
        data-testid="translatedtext-yu7i"
      />
    }
    text={
      <TranslatedText
        stringId="death.summary.warning2.text"
        fallback="This action is irreversible. This should only be done under the direction of the responsible clinician. Do you wish to record the death of this patient?"
        data-testid="translatedtext-xipy"
      />
    }
    continueButtonText={
      <TranslatedText
        stringId="death.action.recordDeath"
        fallback="Record death"
        data-testid="translatedtext-rhyj"
      />
    }
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
    data-testid="basesummaryscreen-3i4u"
  />
);

export const SummaryScreenThree = ({ onStepBack, submitForm, onCancel }) => (
  <BaseSummaryScreen
    heading={
      <TranslatedText
        stringId="death.summary.confirmDeathRecord.text"
        fallback="Confirm death record"
        data-testid="translatedtext-ergl"
      />
    }
    text={
      <>
        <TranslatedText
          stringId="death.summary.warning1.text"
          fallback="If this patient has an active encounter they will be auto-discharged. Please ensure that all encounter details are up-to-date and correct before proceeding."
          data-testid="translatedtext-b6hl"
        />
        <br />
        <br />
        <TranslatedText
          stringId="death.summary.warning2.text"
          fallback="This action is irreversible. This should only be done under the direction of the responsible clinician. Do you wish to record the death of this patient?"
          data-testid="translatedtext-84s2"
        />
      </>
    }
    continueButtonText={
      <TranslatedText
        stringId="death.action.recordDeath"
        fallback="Record death"
        data-testid="translatedtext-gq6e"
      />
    }
    onStepBack={onStepBack}
    onContinue={submitForm}
    onCancel={onCancel}
    data-testid="basesummaryscreen-oo5t"
  />
);
