import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import { RowView, StyledText, StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { RadioOption, RadioButton } from '../RadioButton';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';

export interface RadioButtonGroupProps {
  options: RadioOption[];
  onChange: (value: string) => void;
  value?: string;
  error?: boolean;
  index?: number;
  label?: string;
  CustomComponent?: FC<any>;
}

const getTitleColor = (value?: string, error?: boolean): string => {
  if (value) return theme.colors.TEXT_MID;
  if (error) return theme.colors.ALERT;
  return theme.colors.TEXT_SOFT;
};

export const RadioButtonGroup = ({
  options,
  onChange,
  value,
  error,
  label,
  CustomComponent,
}: RadioButtonGroupProps): JSX.Element => {
  const RadioComponent = CustomComponent || RadioButton;

  return (
    <>
      <RowView>
        {label && (
          <StyledView
            background={theme.colors.WHITE}
            justifyContent="center"
            paddingLeft={screenPercentageToDP(2.42, Orientation.Width)}
            borderWidth={1}
            borderColor={theme.colors.DEFAULT_OFF}
            flex={1}
          >
            <StyledText color={getTitleColor(value, error)}>{label}</StyledText>
          </StyledView>
        )}
        {options.map((option, index) => (
          <RadioComponent
            key={option.label}
            label={option.label}
            value={option.value}
            index={index}
            selected={option.value === value}
            error={error}
            onPress={onChange}
          />
        ))}
      </RowView>
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </>
  );
};
