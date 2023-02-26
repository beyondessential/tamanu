import React, { useState } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { LAB_REQUEST_FORM_TYPES } from 'shared/constants/labs';
import { useQuery } from '@tanstack/react-query';
import { subStrSearch } from '../../utils/subStringSearch';
import { FormSeparatorLine } from '../../components/FormSeparatorLine';
import { SearchField, SuggesterSelectField } from '../../components/Field';
import { Card } from '../../components/Card';
import { Colors } from '../../constants';
import { SelectableTestItem, TestItem } from './TestItem';
import { TextButton } from '../../components/Button';
import { useApi } from '../../api';
import { BodyText } from '../../components/Typography';

const WrapperCard = styled(Card)`
  display: flex;
  padding: 10px;
  height: 500px;
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
  color: ${({ theme }) => theme.palette.primary.main};
  &:hover {
    font-weight: 400;
    text-decoration: underline;
    color: ${({ theme }) => theme.palette.primary.main};
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

const StyledSuggesterSelectField = styled(SuggesterSelectField)`
  .MuiInputBase-input.Mui-disabled {
    background: #f3f5f7;
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
  value = [],
  values: { requestType = LAB_REQUEST_FORM_TYPES.INDIVIDUAL },
  onChange,
}) => {
  const api = useApi();
  const [query, setQuery] = useState({
    labTestPanelId: '',
    labTestCategoryId: '',
    search: '',
  });
  const { data: testTypeData, isFetching } = useQuery(
    ['labTestTypes', query.labTestPanelId],
    () => api.get(`labTestPanel/${encodeURIComponent(query.labTestPanelId)}/labTestTypes`),
    {
      onSuccess: data => {
        onChange(data.map(type => type.id));
      },
      enabled: requestType === LAB_REQUEST_FORM_TYPES.PANEL && !!query.labTestPanelId,
      initialData: testTypes,
    },
  );

  const handleChange = newSelected => onChange({ target: { name, value: newSelected } });

  const handleChangeQuery = event =>
    setQuery({ ...query, [event.target.name]: event.target.value });
  const handleClear = () => {
    setQuery(values => ({ ...values, labTestPanelId: '' }));
    handleChange([]);
  };

  const queriedTypes = filterByTestTypeQuery(testTypeData, query);

  const isSelected = type => value.includes(type.id);
  const allSelected = queriedTypes.length && queriedTypes.every(isSelected);
  const someSelected = queriedTypes.length && queriedTypes.some(isSelected);

  const handleSelectAll = () => handleChange(allSelected ? [] : queriedTypes.map(type => type.id));
  const handleCheck = ({ target: { name: testId, checked } }) => {
    handleChange(checked ? [...value, testId] : value.filter(id => id !== testId));
  };
  return (
    <WrapperCard>
      <SelectorContainer>
        {requestType === LAB_REQUEST_FORM_TYPES.INDIVIDUAL && (
          <SuggesterSelectField
            field={{
              value: query.labTestCategoryId,
              onChange: handleChangeQuery,
            }}
            initialOptions={[[{ label: 'All', value: '' }]]}
            label="Test Category"
            endpoint="labTestCategory"
            name="labTestCategoryId"
            includeAllOption
          />
        )}
        {requestType === LAB_REQUEST_FORM_TYPES.PANEL && (
          <StyledSuggesterSelectField
            field={{
              value: query.labTestPanelId,
              onChange: handleChangeQuery,
            }}
            label="Test Panel"
            endpoint="labTestPanel"
            name="labTestPanelId"
            disabled={query.labTestPanelId}
          />
        )}
        <FormSeparatorLine />
        <Box display="flex" alignItems="center">
          <SelectableTestItem
            name="selectAll"
            indeterminate={someSelected && !allSelected}
            checked={allSelected}
            onChange={handleSelectAll}
          />
          <StyledSearchField
            field={{
              value: query.search,
              onChange: handleChangeQuery,
            }}
            placeholder="Search"
            name="search"
          />
        </Box>
        <FormSeparatorLine />
        <SelectorTable>
          {isFetching && <BodyText>Loading tests</BodyText>}
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
              <BodyText>No tests found.</BodyText>
            ))}
        </SelectorTable>
      </SelectorContainer>
      <SelectorContainer>
        <Box display="flex" justifyContent="space-between">
          <SectionHeader>Selected tests</SectionHeader>
          {value.length > 0 && <ClearAllButton onClick={handleClear}>Clear all</ClearAllButton>}
        </Box>
        <FormSeparatorLine />
        <SelectorTable>
          {value.map(testId => {
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
