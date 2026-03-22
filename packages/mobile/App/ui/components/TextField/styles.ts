import styled from 'styled-components/native';
import { theme } from '/styled/theme';
import { StyledView, StyledViewProps } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';

export interface StyledTextInputProps {
  error?: string;
  focused?: boolean;
  hasValue?: boolean;
  disabled?: boolean;
  fieldFontSize?: string | number;
}

export const InputContainer = styled(StyledView)`
  text-align: center;
  width: 100%;
  height: 100%;
  position: relative;
`;

export const StyledTextInput = styled.TextInput<StyledViewProps>`
  background-color: ${(props: StyledTextInputProps): string => {
    if (props.disabled) return theme.colors.BACKGROUND_GREY;
    return theme.colors.WHITE;
  }};
  border: 1px solid
    ${(props: StyledTextInputProps): string => {
      if (props.error) return theme.colors.ALERT;
      if (props.focused) return theme.colors.PRIMARY_MAIN;
      return theme.colors.DEFAULT_OFF;
    }};
  border-radius: 5px;
  font-size: ${({ fieldFontSize }) =>
    fieldFontSize || screenPercentageToDP(2.18, Orientation.Height)};
  line-height: ${screenPercentageToDP(2.58, Orientation.Height)};
  font-weight: 400;
  justify-content: flex-start;
  color: ${(props: StyledTextInputProps): string => {
    return props.hasValue ? theme.colors.TEXT_DARK : theme.colors.TEXT_SOFT;
  }};
  padding-left: ${screenPercentageToDP(3, Orientation.Width)};
`;
