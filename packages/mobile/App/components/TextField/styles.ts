import Theme from '../../styled/theme';
import styled from 'styled-components/native';
import { StyledView } from '../../styled/common';

export interface InputContainerProps {
  error?: string;
  focused: boolean;
  accessible?: boolean;
  hasValue: boolean;
}

export const InputContainer = styled(StyledView)`
  background-color: ${(props: InputContainerProps) => {
    if (!props.hasValue || (props.hasValue && !props.error))
      return Theme.colors.WHITE;
    if (props.hasValue && props.error) return Theme.colors.ALERT;
  }};
  border: 1px solid
    ${(props: InputContainerProps) => {
      if (props.error) return Theme.colors.ALERT;
      return Theme.colors.MAIN_SUPER_DARK;
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
  color: ${Theme.colors.MAIN_SUPER_DARK};
  padding-left: 10px;
  padding-top: 8px;
`;
