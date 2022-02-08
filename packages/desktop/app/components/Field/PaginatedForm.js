import React, { useState } from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { Tooltip, Typography, Box, Stepper, Step, StepButton } from '@material-ui/core';
import { Button, OutlinedButton } from '../Button';
import { Form } from './Form';
import { ButtonRow } from '../ButtonRow';
import { usePaginatedForm, SurveyScreen } from '../../views/programs/SurveyView';

const Footer = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 24px;
  margin-left: -32px;
  margin-right: -32px;
  margin-bottom: -6px;
  padding-left: 32px;
  padding-right: 32px;
  border-top: 1px solid #dedede;
`;

const StyledStepper = styled(Stepper)`
  padding: 0;
  margin-top: 10px;
`;

const StyledStep = styled(Step)`
  display: flex;
  flex: 1;
  margin: 0 3px 0 0;
  padding: 0;

  &:last-child {
    margin: 0;
  }
`;

const StyledStepButton = styled(StepButton)`
  background: ${props => props.theme.palette.primary.main};
  border-radius: 0;
  height: 10px;
  padding: 0;
  margin: 0;
`;

const FormStepper = ({ screenIndex, handleStep }) => {
  const steps = ['One', 'Two', 'Three'];
  return (
    <StyledStepper nonLinear activeStep={screenIndex} connector={null}>
      {steps.map((label, index) => {
        return (
          <StyledStep key={label}>
            <Tooltip title={label}>
              <StyledStepButton onClick={handleStep(index)} icon={null} />
            </Tooltip>
          </StyledStep>
        );
      })}
    </StyledStepper>
  );
};

const COMPLETE_MESSAGE = `
  Press "Complete" to submit your response,
  or use the Back button to review answers.
`;

const SummaryScreen = ({ onStepBack, onSurveyComplete }) => (
  <div>
    <Typography variant="h6" gutterBottom>
      Survey complete
    </Typography>
    <Typography>{COMPLETE_MESSAGE}</Typography>
    <div>
      <ButtonRow>
        <OutlinedButton onClick={onStepBack}>Prev</OutlinedButton>
        <Button color="primary" variant="contained" onClick={onSurveyComplete}>
          Complete
        </Button>
      </ButtonRow>
    </div>
  </div>
);

const StyledAlert = styled(Alert)`
  margin: 15px 0;
`;

const SuccessScreen = ({ onClose }) => (
  <div>
    <StyledAlert severity="success">Your response has been successfully submitted.</StyledAlert>
    <ButtonRow>
      <Button variant="contained" color="primary" onClick={onClose}>
        Ok
      </Button>
    </ButtonRow>
  </div>
);

const FORM_STATES = {
  SUCCESS: 'success',
  IDLE: 'idle',
};

export const PaginatedForm = ({ components, onCancel, onSubmit }) => {
  const [formState, setFormState] = useState(FORM_STATES.IDLE);

  console.log('onCancel', onCancel);

  const { onStepBack, onStepForward, handleStep, maxIndex, screenIndex } = usePaginatedForm(
    components,
  );

  const onSubmitForm = async data => {
    console.log('Make api request', data);
    await onSubmit(data);
    setFormState(FORM_STATES.SUCCESS);
  };

  if (formState === FORM_STATES.SUCCESS) {
    return <SuccessScreen onClose={onCancel} />;
  }

  return (
    <Form
      initialValues={{}}
      onSubmit={onSubmitForm}
      render={({ values, submitForm }) => {
        if (screenIndex <= maxIndex) {
          const screenComponents = components
            .filter(x => x.screenIndex === screenIndex)
            .sort((a, b) => a.componentIndex - b.componentIndex);

          // add support for custom screen
          // if (screenComponents[0].type === 'CustomScreen') {
          // }

          return (
            <div>
              <FormStepper screenIndex={screenIndex} handleStep={handleStep} />
              <SurveyScreen
                values={values}
                components={screenComponents}
                onStepForward={onStepForward}
                screenIndex={screenIndex}
                onStepBack={screenIndex > 0 ? onStepBack : null}
              />
            </div>
          );
        }

        return <SummaryScreen onStepBack={onStepBack} onSurveyComplete={submitForm} />;
      }}
    />
  );
};
