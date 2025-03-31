import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
    margin-left: 20px;
  }
`;

export const DeathFormScreen = ({
  screenReactElement,
  allQuestionReactElements,
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
  const patient = useSelector(state => state.patient);
  const { children } = screenReactElement.props;
  const screenQuestionReactElements = React.Children.toArray(children);
  const visibleQuestions = getVisibleQuestions(
    values,
    allQuestionReactElements,
    screenQuestionReactElements,
  );
  const showBackButton = screenIndex > 0;
  const showSaveAndClose = screenIndex === 0 && !patient.dateOfDeath;

  const updatedScreenReactElement = {
    ...screenReactElement,
    props: { ...screenReactElement.props, children: visibleQuestions },
  };

  // Inject special value to be used in form validation and only keep specific fields
  const handleSubmit = event => {
    const { clinicianId, timeOfDeath } = values;
    setValues({ clinicianId, timeOfDeath, isPartialWorkflow: true });
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
      {updatedScreenReactElement}
      <Actions mt={4}>
        <Box>
          {showSaveAndClose && (
            <OutlinedButton onClick={toggleSummary} data-test-id='outlinedbutton-zzom'>Save and close</OutlinedButton>
          )}
          {showBackButton && <OutlinedButton onClick={onStepBack} data-test-id='outlinedbutton-nrni'>Back</OutlinedButton>}
        </Box>
        <Box>
          <OutlinedButton onClick={onCancel} data-test-id='outlinedbutton-buqy'>Cancel</OutlinedButton>
          <Button
            color="primary"
            variant="contained"
            onClick={onStepForward}
            data-test-id='button-sjk6'>
            {isLast ? 'Submit' : 'Continue'}
          </Button>
        </Box>
      </Actions>
    </>
  );
};
