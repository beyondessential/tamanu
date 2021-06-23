import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { Checkbox } from '../Checkbox';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  text: string;
  value: string[];
  background?: string;
  color?: string;
  options: { id: string; text: string }[];
}

export const MultiCheckbox = ({
  value = [],
  options,
  onChange,
  error,
  background,
  color
}: CheckboxProps): JSX.Element => {
  const handleCallback = useCallback(
    (isSelected, optionId) => {
      const selectedValues = isSelected
        ? [...new Set([...value, optionId])]
        : value.filter(v => v != optionId);
      onChange(selectedValues);
    },
    [onChange, value, options]
  );

  return (
    <View>
      {options.map(({ id, text }) => (
        <StyledView marginTop={10}>
          <Checkbox
            id={id}
            text={text}
            value={value.includes(id)}
            error={error}
            background={background}
            color={color}
            onChange={handleCallback}
          />
        </StyledView>
      ))}
    </View>
  );
};

MultiCheckbox.defaultProps = {
  background: theme.colors.WHITE,
  color: theme.colors.PRIMARY_MAIN
};
