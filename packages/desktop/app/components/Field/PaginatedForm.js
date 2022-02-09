import React, { useState } from 'react';
import styled from 'styled-components';
import Alert from '@material-ui/lab/Alert';
import { Typography, Box } from '@material-ui/core';
import { Button, OutlinedButton } from '../Button';
import { Form } from './Form';
import { ButtonRow } from '../ButtonRow';
import { checkVisibility } from '../../utils';
import { FormStepper } from './FormStepper';

const COMPLETE_MESSAGE = `
  Press "Complete" to submit your response,
  or use the Back button to review answers.
`;

const DefaultSummaryScreen = ({ onStepBack, submitForm }) => (
  <div>
    <Typography variant="h6" gutterBottom>
      Survey complete
    </Typography>
    <Typography>{COMPLETE_MESSAGE}</Typography>
    <div>
      <ButtonRow>
        <OutlinedButton onClick={onStepBack}>Prev</OutlinedButton>
        <Button color="primary" variant="contained" onClick={submitForm}>
          Complete
        </Button>
      </ButtonRow>
    </div>
  </div>
);

const StyledAlert = styled(Alert)`
  margin: 15px 0;
`;

const DefaultSuccessScreen = ({ onClose }) => (
  <div>
    <StyledAlert severity="success">Your response has been successfully submitted.</StyledAlert>
    <ButtonRow>
      <Button variant="contained" color="primary" onClick={onClose}>
        Ok
      </Button>
    </ButtonRow>
  </div>
);
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

const FormScreen = ({ screenComponent, values, onStepForward, onStepBack, isLast }) => {
  const { children } = screenComponent.props;

  const components = React.Children.toArray(children);
  const questionElements = getVisibleQuestions(components, values);

  const newElement = {
    ...screenComponent,
    props: { ...screenComponent.props, children: questionElements },
  };

  return (
    <>
      {newElement}
      <Box mt={4} display="flex" justifyContent="space-between">
        <OutlinedButton onClick={onStepBack || undefined} disabled={!onStepBack}>
          Back
        </OutlinedButton>
        <Button color="primary" variant="contained" onClick={onStepForward}>
          {isLast ? 'Submit' : 'Continue'}
        </Button>
      </Box>
    </>
  );
};

export const usePaginatedForm = () => {
  const [screenIndex, setScreenIndex] = useState(0);

  const onStepBack = () => {
    setScreenIndex(screenIndex - 1);
  };

  const onStepForward = () => {
    setScreenIndex(screenIndex + 1);
  };

  const handleStep = step => () => {
    setScreenIndex(step);
  };

  return {
    onStepBack,
    onStepForward,
    handleStep,
    screenIndex,
    setScreenIndex,
  };
};

const FORM_STATES = {
  SUCCESS: 'success',
  IDLE: 'idle',
};

export const PaginatedForm = ({
  children,
  onSubmit,
  onCancel,
  SummaryScreen = DefaultSummaryScreen,
  SuccessScreen = DefaultSuccessScreen,
}) => {
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
  const isLast = screenIndex === maxIndex;

  return (
    <Form
      onSubmit={onSubmitForm}
      render={({ submitForm, values }) => {
        if (screenIndex <= maxIndex) {
          const screenComponent = formScreens.find((screen, i) =>
            i === screenIndex ? screen : null,
          );

          return (
            <>
              <FormStepper
                screenIndex={screenIndex}
                handleStep={handleStep}
                screens={formScreens}
              />
              <FormScreen
                screenComponent={screenComponent}
                values={values}
                onStepForward={onStepForward}
                isLast={isLast}
                onStepBack={screenIndex > 0 ? onStepBack : null}
              />
            </>
          );
        }

        return (
          <SummaryScreen onStepBack={onStepBack} submitForm={submitForm} onCancel={onCancel} />
        );
      }}
    />
  );
};
