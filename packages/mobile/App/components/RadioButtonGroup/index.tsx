import React from 'react';
import { RowView, StyledText, StyledView } from '../../styled/common';
import { RadioOption, RadioButton } from '../RadioButton';
import { theme } from '../../styled/theme';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';

export interface RadioButtonGroupProps {
  options: RadioOption[];
  onChange: (value: string) => void;
  value?: string;
  error?: boolean;
  index?: number;
  title?: string;
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
  title,
}: RadioButtonGroupProps): JSX.Element => (
  <RowView>
    {title && (
    <StyledView
      background={theme.colors.WHITE}
      justifyContent="center"
      paddingLeft={screenPercentageToDP(2.42, Orientation.Width)}
      flex={1}
    >
      <StyledText
        color={getTitleColor(value, error)}
      >{title}
      </StyledText>
    </StyledView>
    )}
    {options.map((option, index) => (
      <RadioButton
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
);
