import React, { FunctionComponentElement, ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import * as styledSystem from 'styled-system';
import { theme } from '/styled/theme';
import { RowView, StyledTouchableOpacity, StyledViewProps } from '/styled/common';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TranslatedTextElement } from '/components/Translations/TranslatedText';

type StrNumType = number | string;

interface ButtonContainerProps extends StyledViewProps {
  loadingAction?: boolean;
  outline?: boolean;
  rounded?: boolean;
  borderColor?: string;
  backgroundColor?: string;
  borderRadius?: StrNumType;
  borderWidth?: StrNumType;
  bordered?: boolean;
  flex?: number;
  disabled?: boolean;
}
export interface StyledButtonProps extends ButtonContainerProps {
  id?: string;
  color?: string;
  buttonText?: TranslatedTextElement;
  onPress: (value: any) => void | Promise<any> | Function;
  fontSize?: string | number;
  textColor?: string;
  fontWeight?: StrNumType;
  fullWidth?: boolean;
  children?: ReactNode;
}

const ButtonContainer = styled(RowView)<ButtonContainerProps>`
  ${styledSystem.flexbox};
  height: ${(props): StrNumType =>
    props.height ? props.height : screenPercentageToDP(6.07, Orientation.Height)};
  width: ${(props): StrNumType => (props.width ? props.width : '100%')};
  border-width: ${(props): any => (props.outline ? '1px' : props.borderWidth)};
  border-color: ${(props): string => props.borderColor || 'transparent'};
  border-radius: ${(props): any => {
    if (props.borderRadius) {
      return props.borderRadius;
    } else if (props.bordered) {
      return '50px;';
    }
    return '5px';
  }};
  background: ${(props): string => {
    if (props.disabled) return theme.colors.DISABLED_GREY;
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
    props.fontSize ? props.fontSize : screenPercentageToDP(1.94, Orientation.Height)};
  font-weight: ${(props): StrNumType => (props.fontWeight ? props.fontWeight : 'bold')};
  color: ${(props): string => {
    if (props.textColor) return props.textColor;
    if (props.outline) return props.borderColor || theme.colors.MAIN_SUPER_DARK;
    return theme.colors.WHITE;
  }};
`;

export const Button = ({
  id,
  loadingAction = false,
  onPress,
  children,
  outline,
  borderColor,
  borderWidth = '0px',
  fontSize = '13px',
  height = '47px',
  fontWeight,
  textColor,
  backgroundColor,
  buttonText,
  flex,
  flexDirection,
  alignItems = 'center',
  justifyContent = 'center',
  padding,
  disabled,
  ...rest
}: StyledButtonProps): FunctionComponentElement<{}> => (
  <StyledTouchableOpacity
    testID={id || buttonText?.props?.stringId || buttonText}
    accessibilityLabel={buttonText?.props?.stringId || buttonText}
    flex={flex}
    onPress={onPress}
    {...rest}
    background="transparent"
    disabled={disabled || loadingAction}
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
      height={height}
      borderWidth={borderWidth}
      padding={padding}
      disabled={disabled}
    >
      {loadingAction && <ActivityIndicator size="large" color={theme.colors.WHITE} />}
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
