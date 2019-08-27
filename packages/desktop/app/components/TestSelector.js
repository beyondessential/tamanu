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

  const isTestSelected = React.useCallback(testId => value.some(x => x._id === testId), [value]);

  const updateValue = React.useCallback(
    (testId, isSelected) => {
      const filteredValue = value.filter(v => testTypes.some(x => v._id === x._id));
      let selectedTests = [...filteredValue];
      if (isSelected) selectedTests.push({ _id: testId });
      else selectedTests = selectedTests.filter(x => x._id !== testId);
      onChange({ target: { name, value: selectedTests } });
    },
    [onChange, name, value, testTypes],
  );

  // clear filter whenever testTypes change
  React.useEffect(() => {
    setFilter('');
  }, [testTypes]);

  const displayedTests = testTypes.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));

  const testDisplay =
    displayedTests.length > 0 ? (
      displayedTests.map(t => (
        <TestItem
          label={t.name}
          key={t._id}
          checked={isTestSelected(t._id)}
          onCheck={v => updateValue(t._id, v)}
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
