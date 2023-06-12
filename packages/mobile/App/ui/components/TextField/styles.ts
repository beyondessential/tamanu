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

export interface InputContainerProps {
  error?: string;
  hasValue?: boolean;
  disabled?: boolean;
}

export const InputContainer = styled(StyledView)`
  background-color: ${(props: InputContainerProps): string => {
    if (props.disabled) return theme.colors.BACKGROUND_GREY;
    return theme.colors.WHITE;
  }};
  border: 1px solid
    ${(props: InputContainerProps): string => {
      if (props.error) return theme.colors.ERROR;
      return theme.colors.DEFAULT_OFF;
    }};
  border-radius: 3px;
  padding-top: 3px;
  text-align: center;
  width: 100%;
  height: 100%;
`;

export const StyledTextInput = styled.TextInput<StyledViewProps>`
  font-size: ${screenPercentageToDP(2.18, Orientation.Height)};
  line-height: ${screenPercentageToDP(2.58, Orientation.Height)};
  font-weight: 400;
  height: 100%;
  justify-content: flex-start;
  top: -5px;
  color: ${theme.colors.TEXT_MID};
`;

export interface MaskedInputProps extends TextFieldProps {
  masked?: boolean;
  maskType: TextInputMaskTypeProp;
  options?: TextInputMaskOptionProp;
  width?: string | number;
}

export const StyledMaskedInput = styled(StyledTextInput)<TextInputMaskProps>``;
