import React from 'react';
import styled from 'styled-components';
import { Step, StepButton, Stepper } from '@material-ui/core';

const StyledStepper = styled(Stepper)`
  margin: -18px -32px 30px;
  padding: 0;
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

const BUTTON_PADDING = 15;

const StyledStepButton = styled(StepButton)`
  position: relative;

  // Make the clickable area bigger than the visible button
  padding: ${BUTTON_PADDING}px 0;
  margin: -${BUTTON_PADDING}px 0;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  &:after {
    position: absolute;
    content: '';
    top: 50%;
    transform: translateY(-50%);
    left: 0;
    right: 0;
    background: ${props =>
      props.$isActive ? props.theme.palette.primary.main : props.theme.palette.text.secondary};
    height: 6px;
  }
`;

export const FormStepper = ({ screenIndex, handleStep, screenReactElements }) => (
  <StyledStepper nonLinear activeStep={screenIndex} connector={null}>
    {screenReactElements.map(({ key }, index) => (
      <StyledStep key={key}>
        <StyledStepButton
          onClick={handleStep(index)}
          icon={null}
          $isActive={screenIndex >= index}
        />
      </StyledStep>
    ))}
  </StyledStepper>
);
