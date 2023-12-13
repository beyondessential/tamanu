import { Box, Typography } from '@material-ui/core';
import Alert from '@material-ui/lab/Alert';
import { omit } from 'lodash';
import React, { useState } from 'react';
import styled from 'styled-components';
import { getInvisibleQuestions, getVisibleQuestions } from '../../utils';
import { Button, OutlinedButton } from '../Button';
import { ButtonRow } from '../ButtonRow';
import { Form } from './Form';
import { FormStepper } from './FormStepper';

const COMPLETE_MESSAGE = `
  Press "Complete" to submit your response,
  or use the Back button to review answers.
`;

const DefaultSummaryScreen = ({ onStepBack, submitForm }) => (
  <div>
    <Typography variant="h6" gutterBottom>
      Form complete
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

export const DefaultFormScreen = ({
  screenReactElement,
  allQuestionReactElements,
  values,
  onStepForward,
  onStepBack,
  isLast,
  screenIndex,
  customBottomRow,
}) => {
  const { children } = screenReactElement.props;
  const screenQuestionReactElements = React.Children.toArray(children);
  const visibleQuestions = getVisibleQuestions(
    values,
    allQuestionReactElements,
    screenQuestionReactElements,
  );
  const hasStepBack = screenIndex > 0;

  const updatedScreenReactElement = {
    ...screenReactElement,
    props: { ...screenReactElement.props, children: visibleQuestions },
  };

  return (
    <>
      {updatedScreenReactElement}
      {customBottomRow || (
        <Box mt={4} display="flex" justifyContent="space-between">
          <OutlinedButton onClick={hasStepBack ? onStepBack : undefined} disabled={!hasStepBack}>
            Back
          </OutlinedButton>
          <Button color="primary" variant="contained" onClick={onStepForward}>
            {isLast ? 'Submit' : 'Continue'}
          </Button>
        </Box>
      )}
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
  FormScreen = DefaultFormScreen,
  SummaryScreen = DefaultSummaryScreen,
  SuccessScreen = DefaultSuccessScreen,
  validationSchema,
  initialValues,
  formProps,
}) => {
  const [formState, setFormState] = useState(FORM_STATES.IDLE);
  const [showStepper, setShowStepper] = useState(true);
  const { onStepBack, onStepForward, handleStep, screenIndex } = usePaginatedForm();

  const onSubmitForm = async data => {
    await onSubmit(data);
    setFormState(FORM_STATES.SUCCESS);
  };

  if (formState === FORM_STATES.SUCCESS) {
    return <SuccessScreen onClose={onCancel} />;
  }

  const formScreenReactElements = React.Children.toArray(children);
  const allQuestionReactElements = formScreenReactElements
    .map(s => React.Children.toArray(s.props.children))
    .flat();
  const maxIndex = formScreenReactElements.length - 1;
  const isLast = screenIndex === maxIndex;

  return (
    <Form
      onSubmit={onSubmitForm}
      validationSchema={validationSchema}
      initialValues={initialValues}
      render={({ submitForm, validateForm, values, setValues, setStatus }) => {
        if (screenIndex <= maxIndex) {
          const screenReactElement = formScreenReactElements.find((screen, i) =>
            i === screenIndex ? screen : null
          );

          return (
            <>
              {showStepper && (
                <FormStepper
                  screenIndex={screenIndex}
                  handleStep={handleStep}
                  screenReactElements={formScreenReactElements}
                />
              )}
              <FormScreen
                screenReactElement={screenReactElement}
                allQuestionReactElements={allQuestionReactElements}
                values={values}
                setValues={setValues}
                submitForm={submitForm}
                onStepForward={onStepForward}
                isLast={isLast}
                onStepBack={onStepBack}
                screenIndex={screenIndex}
                setShowStepper={setShowStepper}
                onCancel={onCancel}
                validateForm={validateForm}
                setStatus={setStatus}
              />
            </>
          );
        }

        const submitVisibleValues = event => {
          const invisibleFields = new Set(
            getInvisibleQuestions(values, allQuestionReactElements).map(q => q.props.name),
          );
          const visibleValues = omit({ ...values }, invisibleFields);

          setValues(visibleValues);
          submitForm(event);
        };

        return (
          <SummaryScreen
            onStepBack={onStepBack}
            submitForm={submitVisibleValues}
            onCancel={onCancel}
          />
        );
      }}
      {...formProps}
    />
  );
};
