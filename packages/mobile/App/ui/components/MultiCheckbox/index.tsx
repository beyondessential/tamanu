import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { CustomCheckbox } from '/components/Checkbox/CustomCheckbox';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  value: string[];
  background?: string;
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
    <View>
      {options.map(({ id, text }) => (
        <StyledView marginTop={10}>
          <CustomCheckbox
            id={id}
            text={text}
            value={value.includes(id)}
            error={error}
            onChange={handleCallback}
          />
        </StyledView>
      ))}
    </View>
  );
};

MultiCheckbox.defaultProps = {
  background: theme.colors.WHITE,
};
