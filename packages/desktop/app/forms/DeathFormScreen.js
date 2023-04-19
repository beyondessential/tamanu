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
  const patient = useSelector(state => state.patient);
  const { children } = screenComponent.props;
  const questionComponents = React.Children.toArray(children);
  const visibleQuestions = getVisibleQuestions(questionComponents, values);
  const showBackButton = screenIndex > 0;
  const showSaveAndClose = screenIndex === 0 && !patient.dateOfDeath;

  // screenComponent is a react element (not a component) so we have to attach the new children manually
  const updatedScreenComponent = {
    ...screenComponent,
    props: { ...screenComponent.props, children: visibleQuestions },
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
      {updatedScreenComponent}
      <Actions mt={4}>
        <Box>
          {showSaveAndClose && (
            <OutlinedButton onClick={toggleSummary}>Save and close</OutlinedButton>
          )}
          {showBackButton && <OutlinedButton onClick={onStepBack}>Back</OutlinedButton>}
        </Box>
        <Box>
          <OutlinedButton onClick={onCancel}>Cancel</OutlinedButton>
          <Button color="primary" variant="contained" onClick={onStepForward}>
            {isLast ? 'Submit' : 'Continue'}
          </Button>
        </Box>
      </Actions>
    </>
  );
};
