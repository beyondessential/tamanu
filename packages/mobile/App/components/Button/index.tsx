import React, { FunctionComponentElement, ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import * as styledSystem from 'styled-system';
import { theme } from '/styled/theme';
import {
  StyledTouchableOpacity,
  RowView,
  StyledViewProps,
} from '/styled/common';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

interface ButtonContainer extends StyledViewProps {
  loadingAction?: boolean;
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
  onPress: (value: any) => void | Promise<any> | Function;
  fontSize?: string | number;
  textColor?: string;
  fontWeight?: StrNumType;
  children?: ReactNode;
}

type StrNumType = number | string | undefined;

const ButtonContainer = styled(RowView)<ButtonContainer>`
  ${styledSystem.flexbox};
  height: ${(props): StrNumType =>
    props.height
      ? props.height
      : screenPercentageToDP(6.07, Orientation.Height)};
  width: ${(props): StrNumType => (props.width ? props.width : '100%')};
  border-width: ${(props): StrNumType =>
    props.outline ? '1px' : props.borderWidth};
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
  font-size: ${(props): StrNumType =>
    props.fontSize
      ? props.fontSize
      : screenPercentageToDP(1.94, Orientation.Height)};
  font-weight: ${(props): StrNumType =>
    props.fontWeight ? props.fontWeight : 'bold'};
  color: ${(props): string => {
    if (props.textColor) return props.textColor;
    if (props.outline) return props.borderColor || theme.colors.MAIN_SUPER_DARK;
    return theme.colors.WHITE;
  }};
`;

export const Button = ({
  loadingAction = false,
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
  flexDirection,
  alignItems = 'center',
  justifyContent = 'center',
  ...rest
}: StyledButtonProps): FunctionComponentElement<{}> => (
  <StyledTouchableOpacity
    flex={flex}
    onPress={onPress}
    {...rest}
    background="transparent"
  >
    <ButtonContainer
      {...rest}
      flex={flex}
      flexDirection={flexDirection}
      alignItems={alignItems}
      justifyContent={justifyContent}
      outline={outline}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      borderWidth={borderWidth}
    >
      {loadingAction && (
        <ActivityIndicator size="large" color={theme.colors.WHITE} />
      )}
      {!loadingAction && children}
      {!loadingAction && (
        <StyledButtonText
          outline={outline}
          borderColor={borderColor}
          textColor={textColor}
          fontSize={fontSize}
          fontWeight={fontWeight}
        >
          {buttonText}
        </StyledButtonText>
      )}
    </ButtonContainer>
  </StyledTouchableOpacity>
);
