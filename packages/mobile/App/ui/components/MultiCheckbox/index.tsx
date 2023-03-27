import React, { useCallback } from 'react';
import { StyledView } from '/styled/common';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { OvalCheckbox } from '/components/Checkbox/OvalCheckbox';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  value: string[];
  options: { id: string; text: string }[];
}

export const MultiCheckbox = ({
  value = [],
  options,
  onChange,
  error,
}: CheckboxProps): JSX.Element => {
  const handleCallback = useCallback(
    (isSelected, optionId) => {
      const selectedValues = isSelected
        ? [...new Set([...value, optionId])]
        : value.filter(v => v !== optionId);
      onChange(selectedValues);
    },
    [onChange, value, options],
  );

  return (
    <StyledView style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      {options.map(({ id, text }) => (
        <OvalCheckbox
          id={id}
          text={text}
          value={value.includes(id)}
          error={error}
          onChange={handleCallback}
          marginTop={14}
          width="45%"
        />
      ))}
    </StyledView>
  );
};
