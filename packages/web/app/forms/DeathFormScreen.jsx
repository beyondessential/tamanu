import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Button, OutlinedButton } from '@tamanu/ui-components';
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
  const patient = useSelector((state) => state.patient);
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
  const handleSubmit = (event) => {
    const { clinicianId, timeOfDeath } = values;
    setValues({ clinicianId, timeOfDeath, isPartialWorkflow: true });
    submitForm(event);
  };

  const toggleSummary = () => {
    setShowStepper((prev) => !prev);
    setShowSummary((prev) => !prev);
  };

  if (showSummary) {
    return (
      <SummaryScreenOne
        onCancel={onCancel}
        onStepBack={toggleSummary}
        submitForm={handleSubmit}
        data-testid="summaryscreenone-5hou"
      />
    );
  }

  return (
    <>
      {updatedScreenReactElement}
      <Actions mt={4} data-testid="actions-oa9q">
        <Box data-testid="box-43gs">
          {showSaveAndClose && (
            <OutlinedButton onClick={toggleSummary} data-testid="outlinedbutton-nyjb">
              Save and close
            </OutlinedButton>
          )}
          {showBackButton && (
            <OutlinedButton onClick={onStepBack} data-testid="outlinedbutton-mj9c">
              Back
            </OutlinedButton>
          )}
        </Box>
        <Box data-testid="box-itrv">
          <OutlinedButton onClick={onCancel} data-testid="outlinedbutton-nsd2">
            Cancel
          </OutlinedButton>
          <Button
            color="primary"
            variant="contained"
            onClick={onStepForward}
            data-testid="button-ok5z"
          >
            {isLast ? 'Submit' : 'Continue'}
          </Button>
        </Box>
      </Actions>
    </>
  );
};
