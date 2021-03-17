import React, { FC } from 'react';
import { StyledView, RowView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

interface Circle {
  currentStep?: boolean;
}

const circleSize = screenPercentageToDP(0.85, Orientation.Height);

const Circle: FC<any> = ({ currentStep }: Circle) => (
  <StyledView
    width={circleSize}
    height={circleSize}
    borderRadius={50}
    background={currentStep ? theme.colors.SECONDARY_MAIN : theme.colors.WHITE}
  />
);

Circle.defaultProps = {
  currentStep: false,
};

interface StepMarkerProps {
  step: number;
}

export const StepMarker: FC<StepMarkerProps> = React.memo(
  ({ step }: StepMarkerProps) => {
    const circles = [1, 2, 3];
    return (
      <RowView
        justifyContent="space-around"
        width={screenPercentageToDP(8.59, Orientation.Width)}
        marginTop={screenPercentageToDP(1.21, Orientation.Height)}
      >
        {circles.map(value => (
          <Circle key={value} currentStep={value === step} />
        ))}
      </RowView>
    );
  },
);
