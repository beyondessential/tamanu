import React, { useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Button, OutlinedButton } from '../components';
import { getVisibleQuestions } from '../utils';
import { SummaryScreenOne } from './DeathFormSummaryScreens';

const Actions = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;

  button ~ button {
    margin-left: 12px;
  }
`;

export const DeathFormScreen = ({
  screenComponent,
  values,
  setValues,
  submitForm,
  onStepForward,
  onStepBack,
  isLast,
  screenIndex,
  setShowStepper,
  onCancel,
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const { children } = screenComponent.props;
  const questionComponents = React.Children.toArray(children);
  const visibleQuestions = getVisibleQuestions(questionComponents, values);
  const hasStepBack = screenIndex > 0;
  const showSaveAndClose = screenIndex === 0;
  const Wrapper = showSaveAndClose ? Box : React.Fragment;

  // screenComponent is a react element (not a component) so we have to attach the new children manually
  const updatedScreenComponent = {
    ...screenComponent,
    props: { ...screenComponent.props, children: visibleQuestions },
  };

  // Inject special value to be used in form validation
  const handleSubmit = event => {
    setValues({ ...values, isPartialWorkflow: true });
    submitForm(event);
  };

  const toggleSummary = () => {
    setShowStepper(prev => !prev);
    setShowSummary(prev => !prev);
  };

  if (showSummary) {
    return (
      <SummaryScreenOne onCancel={onCancel} onStepBack={toggleSummary} submitForm={handleSubmit} />
    );
  }

  return (
    <>
      {updatedScreenComponent}
      <Actions mt={4}>
        {showSaveAndClose && (
          <OutlinedButton onClick={toggleSummary}>Save and close</OutlinedButton>
        )}
        <Wrapper>
          <OutlinedButton onClick={hasStepBack ? onStepBack : undefined} disabled={!hasStepBack}>
            Back
          </OutlinedButton>
          <Button color="primary" variant="contained" onClick={onStepForward}>
            {isLast ? 'Submit' : 'Continue'}
          </Button>
        </Wrapper>
      </Actions>
    </>
  );
};
