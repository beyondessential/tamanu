import React from 'react';
import styled from 'styled-components/native';
import posed from 'react-native-pose';
import { theme } from '/styled/theme';
import { StyledText } from '/styled/common';
import { screenPercentageToDP, Orientation } from '/helpers/screen';

const AnimatedLabel = posed.Text({
  open: {
    fontSize: screenPercentageToDP(2.1, Orientation.Height),
  }
});

interface AnimatedText {
  pose: string;
}

const StyledAnimatedLabel = styled(StyledText) <AnimatedText>`
  color: ${theme.colors.TEXT_SUPER_DARK};
  font-size: ${screenPercentageToDP(2.1, Orientation.Height)};
  font-weight: 600;
  padding-left: ${screenPercentageToDP(1, Orientation.Width)};
  margin-bottom: ${screenPercentageToDP(0.5, Orientation.Width)};
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

  return (
    <StyledAnimatedLabel
      as={AnimatedLabel}
      onPress={(): void => onFocus(!focus)}
      pose="open"
    >
      {children}
    </StyledAnimatedLabel>
  );
};
