import React from 'react';
import styled from 'styled-components/native';
import posed from 'react-native-pose';
import { theme } from '/styled/theme';
import { StyledText } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

const AnimatedLabel = posed.Text({
  open: {
    fontSize: screenPercentageToDP(1.74, Orientation.Height),
    bottom: screenPercentageToDP(3.0, Orientation.Height),
  },
  closed: {
    fontSize: screenPercentageToDP(1.94, Orientation.Height),
    bottom: screenPercentageToDP(1.21, Orientation.Height),
  },
});

interface AnimatedText {
  pose: string;
}

const StyledAnimatedLabel = styled(StyledText) <AnimatedText>`
  font-size: ${screenPercentageToDP(1.94, Orientation.Height)};
  font-weight: 400;
  margin-bottom: 5;
  padding-left: ${screenPercentageToDP(2.42, Orientation.Width)};
  position: absolute;
`;

interface LabelProps {
  children: string;
  focus: boolean;
  isValueEmpty: boolean;
  error: string;
  onFocus: Function;
}

export const TextFieldLabel = ({
  children,
  focus,
  onFocus,
  isValueEmpty,
  error,
}: LabelProps): JSX.Element => {
  function getColor(hasValue: boolean, errorMessage?: string): string {
    if (!errorMessage && hasValue) return theme.colors.TEXT_SOFT;
    if (errorMessage) return theme.colors.ALERT;
    return theme.colors.TEXT_MID;
  }
  const isLabelLifted = focus || isValueEmpty ? 'open' : 'closed';
  return (
    <StyledAnimatedLabel
      as={AnimatedLabel}
      onPress={(): void => onFocus(!focus)}
      color={getColor(isValueEmpty, error)}
      pose={isLabelLifted}
    >
      {children}
    </StyledAnimatedLabel>
  );
};
