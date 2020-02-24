import React, { FC } from 'react';
import { StyledView, RowView } from '../../styled/common';
import { theme } from '../../styled/theme';

interface Circle {
  currentStep?: boolean;
}

const Circle: FC<any> = ({ currentStep = false }: Circle) => (
  <StyledView
    width={10}
    height={10}
    borderRadius={50}
    background={currentStep ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
  />
);

interface StepMarkerProps {
  step: number;
}

export const StepMarker: FC<StepMarkerProps> = React.memo(
  ({ step }: StepMarkerProps) => {
    const circles = [1, 2, 3];
    return (
      <RowView justifyContent="space-around" width={60} marginTop={10}>
        {circles.map(value => (
          <Circle key={value} currentStep={value === step} />
        ))}
      </RowView>
    );
  },
);
