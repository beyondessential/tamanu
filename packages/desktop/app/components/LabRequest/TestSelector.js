import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { LAB_REQUEST_SELECT_LAB_METHOD } from 'shared/constants/labs';
import { useQuery } from '@tanstack/react-query';
import { subStrSearch } from '../../utils/subStringSearch';
import { FormSeparatorLine } from '../FormSeparatorLine';
import { Field, Form, SearchField } from '../Field';
import { Card } from '../Card';
import { Colors } from '../../constants';
import { SelectableTestItem, TestItem } from './TestItem';
import { TextButton } from '../Button';
import { LabTestCategoryField } from '../../views/reports/LabTestCategoryField';
import { LabTestPanelField } from './LabTestPanelField';
import { useApi } from '../../api';

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
  return (
    <Form
      initialValues={{ search: '', labTestCategoryId: '', labTestPanelId: '', selectMethod }}
      style={{ height: '100%' }}
      render={props => {
        const { setFieldValue } = props;
        const handleClear = () => {
          setFieldValue('labTestPanelId', '');
          handleChange([]);
        };
        return (
          <TestSelectorForm
            {...props}
            selected={selected}
            testTypes={testTypes}
            onChange={handleChange}
            onClear={handleClear}
          />
        );
      }}
    />
  );
};

const TestSelectorForm = ({ values, selected, onChange, onClear, testTypes }) => {
  const api = useApi();

  const { data: testTypeData, isFetching } = useQuery(
    ['labTestTypes', values.labTestPanelId],
    () => api.get(`labTestPanel/${encodeURIComponent(values.labTestPanelId)}/labTestTypes`),
    {
      onSuccess: data => {
        onChange(data.map(type => type.id));
      },
      enabled:
        values.selectMethod === LAB_REQUEST_SELECT_LAB_METHOD.PANEL && !!values.labTestPanelId,
      initialData: testTypes,
    },
  );

  const queriedTypes = filterByTestTypeQuery(testTypeData, values);

  const isSelected = type => selected.includes(type.id);

  const allSelected = queriedTypes.length && queriedTypes.every(isSelected);
  const someSelected = queriedTypes.length && queriedTypes.some(isSelected);

  const handleSelectAll = () => onChange(allSelected ? [] : queriedTypes.map(type => type.id));

  const handleCheck = ({ target: { name: testId, checked } }) => {
    onChange(checked ? [...selected, testId] : selected.filter(id => id !== testId));
  };
  return (
    <WrapperCard>
      <SelectorContainer>
        {values.selectMethod === LAB_REQUEST_SELECT_LAB_METHOD.INDIVIDUAL && (
          <LabTestCategoryField name="labTestCategoryId" includeAllOption />
        )}
        {values.selectMethod === LAB_REQUEST_SELECT_LAB_METHOD.PANEL && (
          <LabTestPanelField name="labTestPanelId" disabled={values.labTestPanelId} />
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
          {isFetching && <NoTestRow>Loading tests</NoTestRow>}
          {!isFetching &&
            (queriedTypes.length > 0 ? (
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
            ))}
        </SelectorTable>
      </SelectorContainer>
      <SelectorContainer>
        <Box display="flex" justifyContent="space-between">
          <SectionHeader>Selected tests</SectionHeader>
          {selected.length > 0 && <ClearAllButton onClick={onClear}>Clear all</ClearAllButton>}
        </Box>
        <FormSeparatorLine />
        <SelectorTable>
          {selected.map(testId => {
            const testType = testTypeData.find(type => type.id === testId);
            if (!testType) return null;
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
};

export const TestSelectorField = ({ field, ...props }) => (
  <TestSelectorInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
