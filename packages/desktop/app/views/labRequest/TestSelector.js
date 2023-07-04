import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, FormHelperText } from '@material-ui/core';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import { useQuery } from '@tanstack/react-query';
import { subStrSearch } from '../../utils/subStringSearch';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { FormSeparatorLine } from '../../components/FormSeparatorLine';
import { Field, SearchField, SuggesterSelectField } from '../../components/Field';
import { TextButton } from '../../components/Button';
import { BodyText } from '../../components/Typography';
import { SelectableTestItem, TestItem } from './TestItem';

const Container = styled.div`
  .MuiFormHelperText-root {
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    margin: 4px 2px 2px;
  }
`;

const Wrapper = styled.div`
  display: flex;
  padding: 10px;
  width: 100%;
  height: 359px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background: white;
`;

const LabelText = styled(BodyText)`
  color: ${({ theme }) => theme.palette.text.secondary};
  margin-bottom: 10px;
  font-weight: 500;
`;

const TextTypeLabel = styled(LabelText)`
  margin: 4px 0px;
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
  text-transform: none;
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

const RequiredLabel = styled.span`
  color: ${Colors.alert};
  padding-left: 3px;
`;

const useTestTypes = (labTestPanelId, placeholderData, onSuccess) => {
  const api = useApi();
  return useQuery(
    ['labTestTypes', labTestPanelId],
    () => api.get(`labTestPanel/${encodeURIComponent(labTestPanelId)}/labTestTypes`),
    {
      onSuccess,
      placeholderData,
      enabled: !!labTestPanelId,
    },
  );
};

const filterByTestTypeQuery = (testTypes = [], { labTestCategoryId, search }) =>
  testTypes
    // Filter out tests that don't match the search query or category
    .filter(
      result =>
        subStrSearch(search, result.name) &&
        (!labTestCategoryId || result.category.id === labTestCategoryId),
    )
    // Sort by category then title alphabetically
    .sort((a, b) => a.category.name.localeCompare(b.category.name) || a.name.localeCompare(b.name));

export const TestSelectorInput = ({
  name,
  label,
  testTypes,
  value,
  requestFormType,
  labTestPanelId,
  onClearPanel,
  isLoading,
  onChange,
  required,
  helperText,
  error,
}) => {
  const [testFilters, setTestFilters] = useState({
    labTestCategoryId: '',
    search: '',
  });

  const handleChange = newSelected => onChange({ target: { name, value: newSelected } });

  const handleChangePanel = data => {
    handleChange(data.map(type => type.id));
  };
  const handleClear = () => {
    setTestFilters(values => ({ ...values, labTestPanelId: '' }));
    handleChange([]);
    onClearPanel();
  };

  const handleChangeTestFilters = event =>
    setTestFilters({ ...testFilters, [event.target.name]: event.target.value });

  const { data: testTypeData, isFetching } = useTestTypes(
    labTestPanelId,
    testTypes,
    handleChangePanel,
  );

  const showLoadingText = isLoading || isFetching;

  const queriedTypes = filterByTestTypeQuery(testTypeData, testFilters);

  const isSelected = type => value.includes(type.id);
  const allSelected = queriedTypes.length && queriedTypes.every(isSelected);
  const someSelected = queriedTypes.length && queriedTypes.some(isSelected);

  const handleSelectAll = () => handleChange(allSelected ? [] : queriedTypes.map(type => type.id));
  const handleCheck = ({ target: { name: testId, checked } }) => {
    handleChange(checked ? [...value, testId] : value.filter(id => id !== testId));
  };

  return (
    <Container>
      <LabelText>
        {label}
        {required && <RequiredLabel>*</RequiredLabel>}
      </LabelText>
      <Wrapper>
        <SelectorContainer>
          {requestFormType === LAB_REQUEST_FORM_TYPES.INDIVIDUAL && (
            <SuggesterSelectField
              field={{
                value: testFilters.labTestCategoryId,
                onChange: handleChangeTestFilters,
              }}
              initialOptions={[{ label: 'All', value: '' }]}
              label="Test category"
              endpoint="labTestCategory"
              name="labTestCategoryId"
            />
          )}
          {requestFormType === LAB_REQUEST_FORM_TYPES.PANEL && (
            <Field
              name="labTestPanelId"
              label="Test panel"
              component={StyledSuggesterSelectField}
              endpoint="labTestPanel"
              disabled={!!labTestPanelId}
            />
          )}
          <FormSeparatorLine />
          {requestFormType === LAB_REQUEST_FORM_TYPES.INDIVIDUAL && (
            <TextTypeLabel>Test type</TextTypeLabel>
          )}
          <Box display="flex" alignItems="center">
            <SelectableTestItem
              name="selectAll"
              indeterminate={someSelected && !allSelected}
              checked={allSelected}
              onChange={handleSelectAll}
            />
            <StyledSearchField
              field={{
                value: testFilters.search,
                onChange: handleChangeTestFilters,
              }}
              placeholder="Search"
              name="search"
            />
          </Box>
          <FormSeparatorLine />
          <SelectorTable>
            {showLoadingText && <BodyText>Loading tests</BodyText>}
            {!showLoadingText &&
              (queriedTypes.length > 0 ? (
                queriedTypes.map(type => (
                  <SelectableTestItem
                    key={`${type.id}-checkbox`}
                    label={type.name}
                    name={type.id}
                    category={type.category.name}
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
                  category={testType.category.name}
                  onRemove={handleCheck}
                />
              );
            })}
          </SelectorTable>
        </SelectorContainer>
      </Wrapper>
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </Container>
  );
};

export const TestSelectorField = ({ field, ...props }) => (
  <TestSelectorInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
