import React from 'react';
import styled from 'styled-components/native';
import posed from 'react-native-pose';
import { theme } from '../../styled/theme';
import { StyledText } from '../../styled/common';

const AnimatedLabel = posed.Text({
  open: {
    fontSize: 13,
    bottom: 28,
  },
  closed: {
    fontSize: 16,
    bottom: 10,
  },
});

interface AnimatedText {
  pose: string;
}

const StyledAnimatedLabel = styled(StyledText)<AnimatedText>`
  font-size: 16;
  font-weight: 400;
  margin-bottom: 5;
  padding-left: 9;
  position: absolute;
`;

interface LabelProps {
  children: string;
  focus: boolean;
  isValueEmpty: boolean;
  error?: string;
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
