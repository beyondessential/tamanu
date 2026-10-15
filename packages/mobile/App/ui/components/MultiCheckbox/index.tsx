import { uniq } from 'es-toolkit';
import React from 'react';
import { StyleSheet } from 'react-native';
import { OvalCheckbox } from '/components/Checkbox/OvalCheckbox';
import type { BaseInputProps } from '/interfaces/BaseInputProps';
import { StyledView } from '/styled/common';

interface CheckboxProps extends BaseInputProps {
  onChange: Function;
  value: readonly string[];
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

const initialValue = [] as const;

export const MultiCheckbox = ({ value = initialValue, options, onChange }: CheckboxProps) => {
  const handleChange = (isSelected: boolean, optionId: string) => {
    const selectedValues = isSelected
      ? uniq([...value, optionId])
      : value.filter(v => v !== optionId);
    onChange(selectedValues);
  };

  return (
    <StyledView style={styles.container}>
      {options.map(({ id, text }) => (
        <OvalCheckbox
          id={id}
          key={id}
          text={text}
          value={value.includes(id)}
          onChange={handleChange}
          style={styles.checkbox}
        />
      ))}
    </StyledView>
  );
};
