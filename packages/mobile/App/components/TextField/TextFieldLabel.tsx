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
  inputValue: string;
  error?: string;
  onFocus: Function;
}

const TextFieldLabel = ({
  children,
  focus,
  onFocus,
  inputValue,
  error,
}: LabelProps) => {
  function getColor(value: string, error?: string) {
    if (!error && value.length === 0) return theme.colors.TEXT_SOFT;
    if (error) return theme.colors.ALERT;
    return theme.colors.TEXT_MID;
  }
  const isLabelLifted = focus || inputValue.length > 0 ? 'open' : 'closed';
  return (
    <StyledAnimatedLabel
      as={AnimatedLabel}
      onPress={() => onFocus(!focus)}
      color={getColor(inputValue, error)}
      pose={isLabelLifted}>
      {children}
    </StyledAnimatedLabel>
  );
};

export default TextFieldLabel;
