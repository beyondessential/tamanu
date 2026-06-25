import React from 'react';
import styled from 'styled-components/native';
import { TextInput, type TextInputProps } from 'react-native';
import { theme } from '/styled/theme';
import { StyledView } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export interface StyledTextInputCustomProps {
  error?: string;
  focused?: boolean;
  hasValue?: boolean;
  disabled?: boolean;
  fieldFontSize?: string | number;
  height?: string | number;
}

export type StyledTextInputProps = TextInputProps & StyledTextInputCustomProps;

export const InputContainer = styled(StyledView)`
  text-align: center;
  width: 100%;
  height: 100%;
  position: relative;
`;

const StyledTextInputBase = styled(TextInput)<StyledTextInputCustomProps>`
  background-color: ${(props: StyledTextInputCustomProps): string => {
    if (props.disabled) return theme.colors.BACKGROUND_GREY;
    return theme.colors.WHITE;
  }};
  border: 1px solid
    ${(props: StyledTextInputCustomProps): string => {
      if (props.error) return theme.colors.ALERT;
      if (props.focused) return theme.colors.PRIMARY_MAIN;
      return theme.colors.DEFAULT_OFF;
    }};
  border-radius: 5px;
  font-size: ${({ fieldFontSize }) => {
    const v = fieldFontSize || screenPercentageToDP(2.18, Orientation.Height);
    return typeof v === 'number' ? `${v}px` : v;
  }};
  line-height: ${screenPercentageToDP(2.58, Orientation.Height)}px;
  font-weight: 400;
  justify-content: flex-start;
  color: ${(props: StyledTextInputCustomProps): string => {
    return props.hasValue ? theme.colors.TEXT_DARK : theme.colors.TEXT_SOFT;
  }};
  padding-left: ${screenPercentageToDP(3, Orientation.Width)}px;
`;

export const StyledTextInput = React.forwardRef<TextInput, StyledTextInputProps>(
  (props, ref) => React.createElement(StyledTextInputBase, { ...props, ref }),
);

StyledTextInput.displayName = 'StyledTextInput';
