import React, { FunctionComponentElement, ReactNode } from 'react';
import styled from 'styled-components/native';
import theme from '../../styled/theme';

export interface StyledButtonProps {
  height?: string;
  width?: string;
  color?: string;
  outline?: boolean;
  rounded?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  buttonText?: string;
  onPress: Function;
  fontSize?: string;
  textColor?: string;
  fontWeight?: string;
  borderRadius?: string;
  bordered?: boolean;
  children?: ReactNode;
}

const StyledButton = styled.TouchableOpacity`
  flex-direction: row;
  border-radius: 5px;
  align-items: center;
  justify-content: center;
  height: ${(props: StyledButtonProps) =>
    props.height ? props.height : '50px'};
  width: ${(props: StyledButtonProps) => (props.width ? props.width : '100%')};
  border-width: ${(props: StyledButtonProps) =>
    props.outline ? '1px' : '0px'};
  border-color: ${(props: StyledButtonProps) =>
    props.borderColor || theme.colors.MAIN_SUPER_DARK};
  border-radius: ${(props: StyledButtonProps) => {
    if (props.borderRadius) {
      return props.borderRadius;
    } else if (props.bordered) {
      return '50px;';
    }
    return '5px';
  }};
  background: ${(props: StyledButtonProps) => {
    if (props.outline) {
      return 'transparent';
    } else if (props.backgroundColor) {
      return props.backgroundColor;
    }
    return theme.colors.MAIN_SUPER_DARK;
  }};
`;

interface ButtonTextProps {
  fontSize?: string;
  color?: string;
  outline?: boolean;
  textColor?: string;
  fontWeight?: string;
  borderColor?: string;
}
const StyledButtonText = styled.Text`
  font-size: ${(props: ButtonTextProps) =>
    props.fontSize ? props.fontSize : '16px'};
  font-weight: ${(props: ButtonTextProps) =>
    props.fontWeight ? props.fontWeight : 'bold'};
  color: ${(props: ButtonTextProps) => {
    if (props.outline) {
      return props.borderColor || theme.colors.MAIN_SUPER_DARK;
    } else if (props.textColor) {
      return props.textColor;
    }
    return theme.colors.WHITE;
  }};
`;

export default function Button({
  onPress,
  ...rest
}: StyledButtonProps): FunctionComponentElement<{}> {
  return (
    <StyledButton {...rest} onPress={() => onPress()}>
      {rest.children}
      <StyledButtonText
        outline={rest.outline}
        borderColor={rest.borderColor}
        textColor={rest.textColor}
        fontSize={rest.fontSize}
        fontWeight={rest.fontWeight}>
        {rest.buttonText}
      </StyledButtonText>
    </StyledButton>
  );
}
