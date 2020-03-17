import React, { FunctionComponentElement, ReactNode } from 'react';
import styled from 'styled-components/native';
import * as StyledSystem from 'styled-system';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { theme } from '../../styled/theme';
import { SpacingProps } from '../../styled/common';
export interface StyledButtonProps extends SpacingProps {
  color?: string;
  outline?: boolean;
  rounded?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  buttonText?: string;
  onPress: Function;
  fontSize?: string | number;
  textColor?: string;
  fontWeight?: StrNumType;
  borderRadius?: StrNumType;
  borderWidth?: StrNumType;
  bordered?: boolean;
  children?: ReactNode;
  flex?: number;
}

type StrNumType = number | string | undefined;

const StyledButton = styled(TouchableOpacity)<StyledButtonProps>`
  flex-direction: row;  
  align-items: center;
  justify-content: center;
  height: ${(props): StrNumType => (props.height ? props.height : '50px')};
  width: ${(props): StrNumType => (props.width ? props.width : '100%')};
  border-width: ${(props): StrNumType => (props.outline ? '1px' : props.borderWidth)};
  border-color: ${(props): string => props.borderColor || theme.colors.MAIN_SUPER_DARK};
  border-radius: ${(props): StrNumType => {
    if (props.borderRadius) {
      return props.borderRadius;
    } else if (props.bordered) {
      return '50px;';
    }
    return '5px';
  }};
  background: ${(props): string => {
    if (props.outline) return 'transparent';
    if (props.backgroundColor) return props.backgroundColor;
    return theme.colors.MAIN_SUPER_DARK;
  }};
  ${StyledSystem.padding}
  ${StyledSystem.margin}
  ${StyledSystem.flex}
`;

interface ButtonTextProps {
  fontSize?: StrNumType;
  color?: string;
  outline?: boolean;
  textColor?: string;
  fontWeight?: StrNumType;
  borderColor?: string;
}

const StyledButtonText = styled.Text<ButtonTextProps>`
  font-size: ${(props): StrNumType => (props.fontSize ? props.fontSize : '16px')};
  font-weight: ${(props): StrNumType => (props.fontWeight ? props.fontWeight : 'bold')};
  color: ${(props): string => {
    if (props.outline) return props.borderColor || theme.colors.MAIN_SUPER_DARK;
    if (props.textColor) return props.textColor;
    return theme.colors.WHITE;
  }};
`;

export const Button = ({
  onPress,
  children,
  outline,
  borderColor,
  borderWidth = 0,
  fontSize,
  fontWeight,
  textColor,
  buttonText,
  ...rest
}: StyledButtonProps): FunctionComponentElement<{}> => (
  <StyledButton
    borderColor={borderColor}
    outline={outline}
    borderWidth={borderWidth}
    {...rest}
    onPress={(): void => onPress()}
  >
    {children}
    <StyledButtonText
      outline={outline}
      borderColor={borderColor}
      textColor={textColor}
      fontSize={fontSize}
      fontWeight={fontWeight}
    >
      {buttonText}
    </StyledButtonText>
  </StyledButton>
);
