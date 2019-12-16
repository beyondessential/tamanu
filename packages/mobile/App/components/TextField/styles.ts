import styled from 'styled-components/native';
import {
  TextInputMaskProps,
  TextInputMaskOptionProp,
  TextInputMaskTypeProp,
} from 'react-native-masked-text';
import theme from '../../styled/theme';
import { StyledView } from '../../styled/common';
import { TextFieldProps } from './TextField';

export interface InputContainerProps {
  error?: string;
  hasValue?: boolean;
}

export const InputContainer = styled(StyledView)`
  background-color: ${(props: InputContainerProps) => {
    if (!props.hasValue || (props.hasValue && !props.error))
      return theme.colors.WHITE;
    if (props.hasValue && props.error) return theme.colors.ERROR_LIGHT;
  }};
  border: 1px solid
    ${(props: InputContainerProps) => {
      if (props.error) return theme.colors.ERROR;
      return theme.colors.TEXT_SOFT;
    }};
  border-radius: 3px;
  width: 100%;
  height: 100%;
`;

export const StyledTextInput = styled.TextInput`
  flex: 1;
  font-size: 18px;
  line-height: 21px;
  font-weight: 400;
  height: 100%;
  color: ${theme.colors.TEXT_MID};
  padding-left: 10px;
  padding-top: 8px;
`;

export interface MaskedInputProps extends TextFieldProps {
  masked?: boolean;
  maskType: TextInputMaskTypeProp;
  options?: TextInputMaskOptionProp;
  width?: string | number;
}

export const StyledMaskedInput = styled(StyledTextInput)<TextInputMaskProps>``;
