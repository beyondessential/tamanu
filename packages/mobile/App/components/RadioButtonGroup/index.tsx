import React from 'react';
import { RowView } from '../../styled/common';
import { RadioOption, RadioButton } from '../RadioButton';

export interface RadioButtonGroupProps {
  options: RadioOption[];
  onSelectOption: (value: string) => void;
  selected?: string;
  error?: boolean;
  index?: number;
}

export const RadioButtonGroup = ({
  options,
  onSelectOption,
  selected,
  error,
}: RadioButtonGroupProps) => {
  return (
    <RowView>
      {options.map((option, index) => (
        <RadioButton
          key={index}
          label={option.label}
          value={option.value}
          index={index}
          selected={option.value === selected}
          error={error}
          onPress={onSelectOption}
        />
      ))}
    </RowView>
  );
};
