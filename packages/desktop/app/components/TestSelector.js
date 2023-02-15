import React, { useCallback } from 'react';
import styled from 'styled-components';

import { FormSeparatorLine } from './FormSeparatorLine';
import { CheckInput } from './Field';
import { OuterLabelFieldWrapper } from './Field/OuterLabelFieldWrapper';

const NoTestRow = styled.div`
  text-align: center;
  padding-top: 1rem;
`;

const TestRow = styled.div`
  padding: 0.2rem 0;
`;

const TestItem = ({ value, label, checked, onCheck }) => (
  <TestRow>
    <CheckInput name={value} value={checked} label={label} onChange={() => onCheck(!checked)} />
  </TestRow>
);

const SelectorTable = styled.div`
  display: flex;
  flex-direction: column;
  height: 14rem;
  padding: 0;
  margin: 0;
  overflow-y: scroll;
`;

const SelectorContainer = styled.div`
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 0.3rem;
  background: white;
`;

export const TestSelectorInput = ({ name, testTypes, value = [], onChange, label, style }) => {
  const isTestSelected = useCallback(testId => value.some(x => x === testId), [value]);

  const allSelected = value.length > 0 && value.length === testTypes.length;
  const selectAll = useCallback(() => {
    const newValue = allSelected ? [] : testTypes.map(x => x.id);
    onChange({ target: { name, value: newValue } });
  }, [onChange, name, allSelected, testTypes]);

  const updateValue = useCallback(
    (testId, isSelected) => {
      const filteredValue = value.filter(v => testTypes.some(tt => v === tt.id));
      let selectedTests = [...filteredValue];
      if (isSelected) {
        selectedTests.push(testId);
      } else {
        selectedTests = selectedTests.filter(x => x !== testId);
      }
      onChange({ target: { name, value: selectedTests } });
    },
    [onChange, name, value, testTypes],
  );

  const testDisplay =
    testTypes.length > 0 ? (
      testTypes.map(t => (
        <TestItem
          label={t.name}
          value={t.id}
          key={t.id}
          checked={isTestSelected(t.id)}
          onCheck={v => updateValue(t.id, v)}
        />
      ))
    ) : (
      <NoTestRow>No tests found.</NoTestRow>
    );

  return (
    <OuterLabelFieldWrapper label={label} style={style}>
      <SelectorContainer>
        <CheckInput label="Select all" value={allSelected} onChange={selectAll} />
        <FormSeparatorLine />
        <SelectorTable>{testDisplay}</SelectorTable>
      </SelectorContainer>
    </OuterLabelFieldWrapper>
  );
};

export const TestSelectorField = ({ field, ...props }) => (
  <TestSelectorInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
