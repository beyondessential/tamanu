import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { Button, darken } from '@material-ui/core';

const Group = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  grid-column-gap: 0.5rem;
  grid-row-gap: 0.5rem;
`;

const COLORS = {
  DEFAULT: '#ccc',
  NONE_SELECTED: '#eee',
  SELECTED: '#cfc',
};

const SelectableField = styled(Button)`
  padding: 0.5rem;
  text-transform: none;
  box-shadow: none;
  font-weight: 400;
  font-size: 14px;

  background: ${p => {
    if (p.noneSelected) {
      return COLORS.NONE_SELECTED;
    }
    return p.selected ? COLORS.SELECTED : COLORS.DEFAULT;
  }};

  &:hover {
    background: ${p => {
      if (p.noneSelected) {
        return darken(COLORS.NONE_SELECTED, 0.05);
      }
      return p.selected ? darken(COLORS.SELECTED, 0.05) : darken(COLORS.DEFAULT, 0.05);
    }};
  }
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
