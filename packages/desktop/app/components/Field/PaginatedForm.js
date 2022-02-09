import React, { useState } from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { Tooltip, Typography, Box, Stepper, Step, StepButton } from '@material-ui/core';
import { Button, OutlinedButton } from '../Button';
import { Form } from './Form';
import { ButtonRow } from '../ButtonRow';
import { usePaginatedForm } from '../../views/programs/SurveyView';
import { checkVisibility } from '../../utils';
import { FormGrid } from '../FormGrid';

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

export const getVisibleQuestions = (components, values) => {
  return components.filter(c =>
    checkVisibility(
      {
        visibilityCriteria: JSON.stringify(c.props.visibilityCriteria),
        dataElement: { type: 'test' },
      },
      values,
      components.map(x => ({
        dataElement: { id: x.props.name, name: x.props.name, code: x.props.name },
      })),
    ),
  );
};

const FormScreen = ({ ScreenComponent, values, onStepForward, onStepBack }) => {
  const { children } = ScreenComponent.props;

  const components = React.Children.toArray(children);
  const questionElements = getVisibleQuestions(components, values);

  const newElement = {
    ...ScreenComponent,
    props: { ...ScreenComponent.props, children: questionElements },
  };

  return (
    <>
      {newElement}
      <Box mt={4} display="flex" justifyContent="space-between">
        <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
          Back
        </OutlinedButton>
        <Button color="primary" variant="contained" onClick={onStepForward}>
          Continue
        </Button>
      </Box>
    </>
  );
};

export const PaginatedForm = ({ children, onSubmit, onCancel }) => {
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const { onStepBack, onStepForward, handleStep, screenIndex } = usePaginatedForm(children);

  const onSubmitForm = async data => {
    console.log('Make api request', data);
    await onSubmit(data);
    setFormState(FORM_STATES.SUCCESS);
  };

  if (formState === FORM_STATES.SUCCESS) {
    return <SuccessScreen onClose={onCancel} />;
  }

  const formScreens = React.Children.toArray(children);
  const maxIndex = formScreens.length - 1;
  console.log('screenIndex', screenIndex);
  console.log('maxIndex', maxIndex);

  return (
    <div>
      <Form
        onSubmit={onSubmitForm}
        render={({ submitForm, values }) => {
          if (screenIndex <= maxIndex) {
            const ScreenComponent = formScreens.find((screen, i) =>
              i === screenIndex ? screen : null,
            );

            return (
              <div>
                <FormStepper screenIndex={screenIndex} handleStep={handleStep} />
                <FormScreen
                  ScreenComponent={ScreenComponent}
                  values={values}
                  onStepForward={onStepForward}
                  screenIndex={screenIndex}
                  onStepBack={screenIndex > 0 ? onStepBack : null}
                />
              </div>
            );
          }

          console.log('summary...');

          return <SummaryScreen onStepBack={onStepBack} onSurveyComplete={submitForm} />;
        }}
      />
    </div>
  );
};
