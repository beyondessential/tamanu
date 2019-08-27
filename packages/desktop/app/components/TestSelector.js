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

export const TestSelectorInput = ({ name, testTypes, value = [], onChange, ...props }) => {
  const [filter, setFilter] = React.useState('');
  const validValues = new Set(testTypes.map(x => x.value));
  const isTestSelected = React.useCallback(
    testId => value.some(x => x === testId),
    [value],
  );
  const updateValue = React.useCallback(
    (testId, isSelected) => {
      const filteredValue = value.filter(v => testTypes.some(x => v === x.value));
      console.log(filteredValue);
      const selectedTests = new Set(filteredValue);
      if(isSelected)
        selectedTests.add(testId);
      else
        selectedTests.delete(testId);
      onChange({ target: { name, value: [...selectedTests] } });
    },
    [onChange, name, value, testTypes],
  );

  // clear filter whenever testTypes change
  React.useEffect(() => {
    setFilter('');
  }, [testTypes]);

  const displayedTests = testTypes.filter(t => t.label.toLowerCase().includes(filter.toLowerCase()));

  const testDisplay =
    displayedTests.length > 0 ? (
      displayedTests.map(t => (
        <TestItem
          {...t}
          key={t.value}
          checked={isTestSelected(t.value)}
          onCheck={v => updateValue(t.value, v)}
        />
      ))
    ) : (
      <NoTestRow>No tests found matching this filter.</NoTestRow>
    );

  return (
    <SelectorContainer {...props}>
      <div>{JSON.stringify(value)}</div>
      <TextInput label="Filter tests" value={filter} onChange={t => setFilter(t.target.value)} />
      <SelectorTable>{testDisplay}</SelectorTable>
    </SelectorContainer>
  );
};

export const TestSelectorField = ({ field, ...props }) => (
  <TestSelectorInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
