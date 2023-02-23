import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { LAB_REQUEST_SELECT_LAB_METHOD } from 'shared/constants/labs';
import { subStrSearch } from '../../utils/subStringSearch';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { Field, Form, SearchField } from '../Field';
import { Card } from '../Card';
import { Colors } from '../../constants';
import { SelectableTestItem, TestItem } from './TestItem';
import { TextButton } from '../Button';
import { LabTestCategoryField } from '../../views/reports/LabTestCategoryField';
import { LabTestPanelField } from './LabTestPanelField';

const NoTestRow = styled.div`
  color: ${Colors.softText};
`;

const WrapperCard = styled(Card)`
  display: flex;
  padding: 10px;
  height: 100%;
`;

const SelectorTable = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  overflow-y: scroll;
  ::-webkit-scrollbar {
    width: 20px;
  }

  ::-webkit-scrollbar-track {
    background-color: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${Colors.softText};
    border-radius: 20px;
    border: 7px solid transparent;
    background-clip: content-box;
  }
`;

const SelectorContainer = styled.div`
  padding: 1rem;
  border-radius: 0.3rem;
  width: 50%;
  background: white;
  display: flex;
  flex-direction: column;
`;

const SectionHeader = styled.span`
  font-size: 15px;
  line-height: 18px;
  font-weight: 500;
  color: ${Colors.darkText};
`;

const ClearAllButton = styled(TextButton)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 400;
  text-decoration: underline;
  color: ${Colors.primary};
  &:hover {
    font-weight: 400;
    text-decoration: underline;
    color: ${Colors.primary};
  }
`;

const StyledSearchField = styled(SearchField)`
  width: 100%;
  .MuiInputBase-root {
    padding-left: 0;
  }
  .MuiOutlinedInput-root {
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border: none;
    }
    .MuiOutlinedInput-notchedOutline {
      border: none;
    }
  }
`;

const filterByTestTypeQuery = (testTypes, { labTestCategoryId, search }) =>
  testTypes
    // Filter out tests that don't match the search query or category
    .filter(
      result =>
        subStrSearch(search, result.name) &&
        (!labTestCategoryId || result.labTestCategoryId === labTestCategoryId),
    )
    // Sort by category then title alphabetically
    .sort(
      (a, b) =>
        a.labTestCategoryId.localeCompare(b.labTestCategoryId) || a.name.localeCompare(b.name),
    );

export const TestSelectorInput = ({
  name,
  testTypes,
  selected = [],
  onChange,
  selectMethod = LAB_REQUEST_SELECT_LAB_METHOD.INDIVIDUAL,
}) => {
  const handleChange = newSelected => onChange({ target: { name, value: newSelected } });
  const handleClear = () => handleChange([]);

  return (
    <Form
      initialValues={{ search: '', labTestCategoryId: '', labTestPanelId: '' }}
      style={{ height: '100%' }}
      render={({ values }) => {
        const queriedTypes = filterByTestTypeQuery(testTypes, values);

        const isSelected = type => selected.includes(type.id);

        const allSelected = queriedTypes.length && queriedTypes.every(isSelected);
        const someSelected = queriedTypes.length && queriedTypes.some(isSelected);

        const handleSelectAll = () =>
          handleChange(allSelected ? [] : queriedTypes.map(type => type.id));

        const handleCheck = ({ target: { name: testId, checked } }) => {
          handleChange(checked ? [...selected, testId] : selected.filter(id => id !== testId));
        };
        return (
          <WrapperCard>
            <SelectorContainer>
              {selectMethod === LAB_REQUEST_SELECT_LAB_METHOD.INDIVIDUAL && (
                <LabTestCategoryField name="labTestCategoryId" includeAllOption />
              )}
              {selectMethod === LAB_REQUEST_SELECT_LAB_METHOD.PANEL && (
                <LabTestPanelField name="labTestPanelId" />
              )}
              <FormSeparatorLine />
              <Box display="flex" alignItems="center">
                <SelectableTestItem
                  name="selectAll"
                  indeterminate={someSelected && !allSelected}
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
                <Field placeholder="Search" name="search" component={StyledSearchField} />
              </Box>
              <FormSeparatorLine />
              <SelectorTable>
                {queriedTypes.length > 0 ? (
                  queriedTypes.map(type => (
                    <SelectableTestItem
                      key={`${type.id}-checkbox`}
                      label={type.name}
                      name={type.id}
                      category={type.labTestCategoryId}
                      checked={isSelected(type)}
                      onChange={handleCheck}
                    />
                  ))
                ) : (
                  <NoTestRow>No tests found.</NoTestRow>
                )}
              </SelectorTable>
            </SelectorContainer>
            <SelectorContainer>
              <Box display="flex" justifyContent="space-between">
                <SectionHeader>Selected tests</SectionHeader>
                {selected.length > 0 && (
                  <ClearAllButton onClick={handleClear}>Clear all</ClearAllButton>
                )}
              </Box>
              <FormSeparatorLine />
              <SelectorTable>
                {selected.map(testId => {
                  const testType = testTypes.find(type => type.id === testId);
                  return (
                    <TestItem
                      key={`${testId}-selected`}
                      label={testType.name}
                      name={testId}
                      category={testType.labTestCategoryId}
                      onRemove={handleCheck}
                    />
                  );
                })}
              </SelectorTable>
            </SelectorContainer>
          </WrapperCard>
        );
      }}
    />
  );
};

export const IndividualTestSelectorField = ({ field, ...props }) => (
  <TestSelectorInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
