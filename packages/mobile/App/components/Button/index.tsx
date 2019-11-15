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

const StyledButton = styled.TouchableOpacity<StyledButtonProps>`
  flex-direction: row;
  border-radius: 5px;
  align-items: center;
  justify-content: center;
  height: ${props => (props.height ? props.height : '50px')};
  width: ${props => (props.width ? props.width : '100%')};
  border-width: ${props => (props.outline ? '1px' : '0px')};
  border-color: ${props => props.borderColor || theme.colors.MAIN_SUPER_DARK};
  border-radius: ${props => {
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
const StyledButtonText = styled.Text<ButtonTextProps>`
  font-size: ${props => (props.fontSize ? props.fontSize : '16px')};
  font-weight: ${props => (props.fontWeight ? props.fontWeight : 'bold')};
  color: ${props => {
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
  children,
  outline,
  borderColor,
  fontSize,
  fontWeight,
  textColor,
  ...rest
}: StyledButtonProps): FunctionComponentElement<{}> {
  return (
    <StyledButton {...rest} onPress={() => onPress()}>
      {children}
      <StyledButtonText
        outline={outline}
        borderColor={borderColor}
        textColor={textColor}
        fontSize={fontSize}
        fontWeight={fontWeight}>
        {rest.buttonText}
      </StyledButtonText>
    </StyledButton>
  );
}
