import styled from 'styled-components/native';
import {
  TextInputMaskProps,
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from 'react-native-masked-text';
import { theme } from '/styled/theme';
import { StyledView, StyledViewProps } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TextFieldProps } from './TextField';

export interface StyledTextInputProps {
  error?: string;
  focused?: boolean;
  hasValue?: boolean;
  disabled?: boolean;
}

export const InputContainer = styled(StyledView)`
  text-align: center;
  width: 100%;
  height: 100%;
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
  font-size: ${screenPercentageToDP(2.18, Orientation.Height)};
  line-height: ${screenPercentageToDP(2.58, Orientation.Height)};
  font-weight: 400;
  justify-content: flex-start;
  color: ${(props: StyledTextInputProps): string => {
    return props.hasValue ? theme.colors.TEXT_DARK : theme.colors.TEXT_SOFT;
  }};
  padding-left: ${screenPercentageToDP(3.5, Orientation.Width)};
`;

export interface MaskedInputProps extends TextFieldProps {
  masked?: boolean;
  maskType: TextInputMaskTypeProp;
  options?: TextInputMaskOptionProp;
  width?: string | number;
}

export const StyledMaskedInput = styled(StyledTextInput)<TextInputMaskProps>``;
