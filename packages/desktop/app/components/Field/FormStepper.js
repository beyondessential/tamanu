import React from 'react';
import styled from 'styled-components';
import { Step, StepButton, Stepper } from '@material-ui/core';
import { Colors } from '../../constants';

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

const StyledStepButton = styled(StepButton)`
  background: ${props => (props.$isActive ? props.theme.palette.primary.main : Colors.midText)};
  border-radius: 0;
  height: 6px;
  padding: 0;
  margin: 0;
`;

export const FormStepper = ({ screenIndex, handleStep, screens }) => {
  return (
    <StyledStepper nonLinear activeStep={screenIndex} connector={null}>
      {screens.map(({ key }, index) => {
        return (
          <StyledStep key={key}>
            <StyledStepButton
              onClick={handleStep(index)}
              icon={null}
              $isActive={screenIndex >= index}
            />
          </StyledStep>
        );
      })}
    </StyledStepper>
  );
};
