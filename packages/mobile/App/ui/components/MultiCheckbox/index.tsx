import React, { useCallback } from 'react';
import { StyledView } from '/styled/common';
import { BaseInputProps } from '/interfaces/BaseInputProps';
import { OvalCheckbox } from '/components/Checkbox/OvalCheckbox';
import { StyleSheet } from 'react-native';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  value: string[];
  options: { id: string; text: string }[];
}

const styles = StyleSheet.create({
  container: {
    marginTop: -10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  checkbox: {
    marginTop: 12,
    width: '45%',
  },
});

export const MultiCheckbox = ({ value = [], options, onChange }: CheckboxProps): JSX.Element => {
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
    <StyledView style={styles.container}>
      {options.map(({ id, text }) => (
        <OvalCheckbox
          id={id}
          key={id}
          text={text}
          value={value.includes(id)}
          onChange={handleCallback}
          style={styles.checkbox}
        />
      ))}
    </StyledView>
  );
};
