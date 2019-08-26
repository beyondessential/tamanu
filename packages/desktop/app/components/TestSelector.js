import React from 'react';
import styled from 'styled-components';

import { TextInput, CheckInput } from './Field';

const TestRow = styled.div`
  border-bottom: 1px solid rgba(0,0,0,0.2);
  padding: 0.2rem;
`;

const TestItem = ({ value, label, checked, onCheck }) => (
  <TestRow>
    <CheckInput value={checked} label={label} onChange={t => onCheck(!checked)}/>
  </TestRow>
);

const SelectorTable = styled.div`
  display: grid;
  height: 14rem;
  overflow-y: scroll;
`;

const SelectorContainer = styled.div`
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 0.3rem;
`;

export const TestSelectorInput = ({ name, tests, value={}, onChange, ...props }) => {
  const [filter, setFilter] = React.useState("");

  return (
    <SelectorContainer {...props}>
      <TextInput 
        label="Filter tests"
        value={filter}
        onChange={t => setFilter(t.target.value)} 
      />
      <SelectorTable>
        {tests
          .filter(t => t.label.toLowerCase().includes(filter.toLowerCase()))
          .map(t => (
            <TestItem 
              {...t} 
              key={t.value} 
              checked={value[t.value]}
              onCheck={(v) => onChange({ target: { name, value: { ...value, [t.value]: v}}})}
            />
          ))
        }
      </SelectorTable>
    </SelectorContainer>
  );
};

export const TestSelectorField = ({ field, ...props }) => (
  <TestSelectorInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
