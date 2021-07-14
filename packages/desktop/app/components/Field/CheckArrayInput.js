import React, { useCallback } from 'react';
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
  background: ${ p => {
    if (p.noneSelected) {
      return '#eee';
    } else {
      return p.selected ? '#cfc' : '#ccc'
    }
  } };
`;

export const CheckArrayInput = ({
  options,
  field,
  ...props
}) => {
  const name = field.name;
  const currentList = (field ? field.value : props.value) || [];
  const onChange = field ? field.onChange : props.onChange;

  const toggle = React.useCallback(item => {
    if (currentList.includes(item)) {
      // set 
      const newList = currentList.filter(v => v != item);
      onChange({ target: { value: newList, name } });
    } else {
      // unset
      const newList = currentList.concat(item);
      onChange({ target: { value: newList, name } });
    }
  });

  return (
      <Group>
        { options.map(({ value, label }) =>
          <SelectableField 
            onClick={() => toggle(value)}
            selected={currentList.includes(value)}
            noneSelected={currentList.length === 0}
            key={value}
          >
            { label }
          </SelectableField>
        ) }
      </Group>
  );
};
