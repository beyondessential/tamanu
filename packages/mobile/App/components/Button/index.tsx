import React, { FunctionComponentElement, ReactNode } from 'react';
import styled from 'styled-components/native';
import { theme } from '../../styled/theme';
import { StyledTouchableOpacity, SpacingProps, RowView } from '../../styled/common';

interface ButtonContainer extends SpacingProps {
  outline?: boolean;
  rounded?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  borderRadius?: StrNumType;
  borderWidth?: StrNumType;
  bordered?: boolean;
  flex?: number;
}
export interface StyledButtonProps extends ButtonContainer {
  color?: string;
  buttonText?: string;
  onPress: (value: any) => void | Function;
  fontSize?: string | number;
  textColor?: string;
  fontWeight?: StrNumType;
  children?: ReactNode;
}

type StrNumType = number | string | undefined;

const ButtonContainer = styled(RowView)<ButtonContainer>`  
  align-items: center;
  justify-content: center;
  height: ${(props): StrNumType => (props.height ? props.height : '50px')};
  width: ${(props): StrNumType => (props.width ? props.width : '100%')};
  border-width: ${(props): StrNumType => (props.outline ? '1px' : props.borderWidth)};
  border-color: ${(props): string => props.borderColor || 'transparent'};
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
  borderWidth = '0px',
  fontSize,
  fontWeight,
  textColor,
  backgroundColor,
  buttonText,
  flex,
  ...rest
}: StyledButtonProps): FunctionComponentElement<{}> => (
  <StyledTouchableOpacity
    onPress={onPress}
    {...rest}
    background="transparent"
  >
    <ButtonContainer
      {...rest}
      flex={flex}
      outline={outline}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      borderWidth={borderWidth}
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
    </ButtonContainer>
  </StyledTouchableOpacity>
);
