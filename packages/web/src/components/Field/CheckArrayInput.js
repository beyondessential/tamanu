import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

const Group = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const SelectableField = styled.div`
  margin: 0.2rem;
  padding: 0.2rem;
  min-width: 8rem;
  background: ${p => {
    if (p.noneSelected) {
      return '#eee';
    }
    return p.selected ? '#cfc' : '#ccc';
  }};
`;

export const CheckArrayInput = ({ options, field, value: propsValue, onChange: propsOnChange }) => {
  const { name } = field;
  const currentList = useMemo(() => (field ? field.value : propsValue) || [], [field, propsValue]);
  const onChange = field ? field.onChange : propsOnChange;

  const toggle = useCallback(
    item => {
      if (currentList.includes(item)) {
        // set
        const newList = currentList.filter(v => v !== item);
        onChange({ target: { value: newList, name } });
      } else {
        // unset
        const newList = currentList.concat(item);
        onChange({ target: { value: newList, name } });
      }
    },
    [currentList, onChange, name],
  );

  return (
    <Group>
      {options.map(({ value, label }) => (
        <SelectableField
          onClick={() => toggle(value)}
          selected={currentList.includes(value)}
          noneSelected={currentList.length === 0}
          key={value}
        >
          {label}
        </SelectableField>
      ))}
    </Group>
  );
};
