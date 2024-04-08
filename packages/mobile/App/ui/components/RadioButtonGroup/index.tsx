import React, { FC } from 'react';
import { RowView, StyledText } from '/styled/common';
import { theme } from '/styled/theme';
import { RadioButton, RadioOption } from '../RadioButton';
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
  labelFontSize?: string | number;
  componentWidth?: string;
}

export const RadioButtonGroup = ({
  options,
  onChange,
  value,
  error,
  label,
  required = false,
  CustomComponent,
  labelFontSize,
  componentWidth,
}: RadioButtonGroupProps): JSX.Element => {
  const RadioComponent = CustomComponent || RadioButton;

  return (
    <>
      {!!label && (
        <StyledText
          fontSize={labelFontSize}
          fontWeight={600}
          marginBottom={2}
          color={theme.colors.TEXT_SUPER_DARK}
        >
          {label}
          {required && <RequiredIndicator />}
        </StyledText>
      )}
      <RowView marginBottom={10}>
        {options.map((option, index) => (
          <RadioComponent
            key={option.label}
            label={option.label}
            value={option.value}
            index={index}
            selected={option.value === value}
            error={error}
            onPress={onChange}
            width={componentWidth}
          />
        ))}
      </RowView>
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </>
  );
};
