import React, { FC } from 'react';
import styled from 'styled-components/native';
import { RowView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { RadioOption, RadioButton } from '../RadioButton';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';

export interface RadioButtonGroupProps {
  options: RadioOption[];
  onChange: (value: string) => void;
  value?: string;
  error?: boolean;
  index?: number;
  label?: string;
  required?: boolean;
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
  font-weight: 500;
  padding-left: ${screenPercentageToDP(1, Orientation.Width)};
  margin-bottom: ${screenPercentageToDP(0.5, Orientation.Width)};
`;

export const RadioButtonGroup = ({
  options,
  onChange,
  value,
  error,
  label,
  required = false,
  CustomComponent,
}: RadioButtonGroupProps): JSX.Element => {
  const RadioComponent = CustomComponent || RadioButton;

  return (
    <>
      {Boolean(label) && (
        <Label fontSize={14} fontWeight={500}>
          {label}
          {required && <RequiredIndicator />}
        </Label>
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
