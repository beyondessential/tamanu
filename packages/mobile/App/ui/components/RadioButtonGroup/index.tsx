import React, { FC } from 'react';
import { StyleSheet } from 'react-native';
import styled from 'styled-components/native';
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

const Label = styled(StyledText)`
  color: ${theme.colors.TEXT_SUPER_DARK};
  font-size: ${screenPercentageToDP(2.1, Orientation.Height)};
  font-weight: 600;
  padding-left: ${screenPercentageToDP(1, Orientation.Width)};
  margin-bottom: ${screenPercentageToDP(0.5, Orientation.Width)};
`;

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
      {Boolean(label) && (
        <Label>{label}</Label>
      )}
      <RowView>
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
