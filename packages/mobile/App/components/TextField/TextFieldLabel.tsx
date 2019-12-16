import React from 'react';
import styled from 'styled-components/native';
import theme from '../../styled/theme';
import { StyledText } from '../../styled/common';
import posed from 'react-native-pose';

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
}: LabelProps) => {
  function getColor(hasValue: boolean, error?: string) {
    if (!error && hasValue) return theme.colors.TEXT_SOFT;
    if (error) return theme.colors.ALERT;
    return theme.colors.TEXT_MID;
  }
  const isLabelLifted = focus || isValueEmpty ? 'open' : 'closed';
  return (
    <StyledAnimatedLabel
      as={AnimatedLabel}
      onPress={() => onFocus(!focus)}
      color={getColor(isValueEmpty, error)}
      pose={isLabelLifted}>
      {children}
    </StyledAnimatedLabel>
  );
};
