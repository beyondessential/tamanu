import React from 'react';
import styled from 'styled-components';

import { TextInput, CheckInput } from './Field';

const NoTestRow = styled.div`
  text-align: center;
  padding-top: 1rem;
`;

const TestRow = styled.div`
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  padding: 0.2rem;
`;

const TestItem = ({ label, checked, onCheck }) => (
  <TestRow>
    <CheckInput value={checked} label={label} onChange={() => onCheck(!checked)} />
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

const filterValueObject = (value, tests) => {
  const filteredValue = {};
  Object.entries(value)
    .filter(x => x[1]) // only include true values
    .filter(x => tests.some(t => t.value === x[0])) // only include available values
    .forEach(([k]) => {
      filteredValue[k] = true;
    });
  return filteredValue;
};

export const TestSelectorInput = ({ name, tests, value = {}, onChange, ...props }) => {
  const [filter, setFilter] = React.useState('');
  const updateValue = React.useCallback(
    newValue => {
      const filteredValue = filterValueObject(newValue, tests);
      onChange({ target: { name, value: filteredValue } });
    },
    [onChange, name, tests],
  );

  // clear filter whenever tests change
  React.useEffect(() => {
    setFilter('');
  }, [tests]);

  const displayedTests = tests.filter(t => t.label.toLowerCase().includes(filter.toLowerCase()));

  const testDisplay =
    displayedTests.length > 0 ? (
      displayedTests.map(t => (
        <TestItem
          {...t}
          key={t.value}
          checked={value[t.value]}
          onCheck={v => updateValue({ ...value, [t.value]: v })}
        />
      ))
    ) : (
      <NoTestRow>No tests found matching this filter.</NoTestRow>
    );

  return (
    <SelectorContainer {...props}>
      <TextInput label="Filter tests" value={filter} onChange={t => setFilter(t.target.value)} />
      <SelectorTable>{testDisplay}</SelectorTable>
    </SelectorContainer>
  );
};

export const TestSelectorField = ({ field, ...props }) => (
  <TestSelectorInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
