import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box, FormHelperText, capitalize } from '@material-ui/core';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/shared/constants/labs';
import { useQuery } from '@tanstack/react-query';
import { subStrSearch } from '../../utils/subStringSearch';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { FormSeparatorLine } from '../../components/FormSeparatorLine';
import { SearchField, SuggesterSelectField } from '../../components/Field';
import { TextButton } from '../../components/Button';
import { BodyText } from '../../components/Typography';
import { SelectableTestItem, TestItem } from './TestItem';

const SELECTABLE_DATA_ENDPOINTS = {
  [LAB_REQUEST_FORM_TYPES.PANEL]: 'labTestPanel',
  [LAB_REQUEST_FORM_TYPES.INDIVIDUAL]: 'labTestType',
};

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
    height: 35px;
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
  .MuiInputBase-input {
    padding-top: 3px;
    padding-bottom: 3px;
    font-size: 14px;
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

const useSelectable = formType => {
  const api = useApi();
  const endpoint = SELECTABLE_DATA_ENDPOINTS[formType];
  return useQuery([endpoint], () => api.get(endpoint), {
    placeholderData: [],
  });
};

const queryBySearch = (formType, data, { search, labTestCategoryId }) =>
  data.filter(result => {
    const nameMatch = subStrSearch(search, result.name);
    if (formType === LAB_REQUEST_FORM_TYPES.PANEL) {
      return nameMatch || subStrSearch(search, result.category?.name);
    }
    return nameMatch && (!labTestCategoryId || result.category.id === labTestCategoryId);
  });

const sortByCategoryAndName = (a, b) =>
  a.category?.name.localeCompare(b.category?.name) || a.name.localeCompare(b.name);

export const TestSelectorInput = ({
  name,
  value,
  requestFormType,
  labelConfig,
  isLoading,
  onChange,
  helperText,
  error,
}) => {
  const {
    selectableName,
    label = labelConfig.subheading,
    searchFieldPlaceholder = 'Search',
  } = labelConfig;
  const [searchQuery, setSearchQuery] = useState({
    labTestCategoryId: '',
    search: '',
  });

  const { data, isFetching } = useSelectable(requestFormType);
  const queriedData = queryBySearch(requestFormType, data, searchQuery).sort(sortByCategoryAndName);

  const showLoadingText = isLoading || isFetching;
  const selected = useMemo(() => data.filter(({ id }) => value.includes(id)), [data, value]);
  const isSelected = ({ id }) => value.includes(id);
  const allSelected = queriedData.length && queriedData.every(isSelected);
  const someSelected = queriedData.some(isSelected) && !allSelected;

  const handleChange = newSelected => {
    if (!onChange) return;
    const selectedObjects = data.filter(({ id }) => newSelected.includes(id));
    onChange({ target: { name, value: newSelected }, selectedObjects });
  };

  const handleClear = () => {
    handleChange([]);
  };
  const handleChangeSearchQuery = event =>
    setSearchQuery({ ...searchQuery, [event.target.name]: event.target.value });

  const handleSelectAll = () =>
    handleChange(
      allSelected
        ? value.filter(id => !queriedData.some(({ id: dataId }) => dataId === id))
        : [...value, ...queriedData.filter(({ id }) => !value.includes(id)).map(({ id }) => id)],
    );
  const handleSelect = event => {
    handleChange(
      event.target.checked
        ? [...value, event.target.name]
        : value.filter(id => id !== event.target.name),
    );
  };

  return (
    <Container>
      <LabelText>{label}</LabelText>
      <Wrapper>
        <SelectorContainer>
          {requestFormType === LAB_REQUEST_FORM_TYPES.INDIVIDUAL && (
            <>
              <SuggesterSelectField
                field={{
                  value: searchQuery.labTestCategoryId,
                  onChange: handleChangeSearchQuery,
                }}
                initialOptions={[{ label: 'All', value: '' }]}
                label="Test category"
                endpoint="labTestCategory"
                name="labTestCategoryId"
              />
              <FormSeparatorLine />
            </>
          )}
          <TextTypeLabel>{capitalize(selectableName)}s</TextTypeLabel>
          <Box display="flex" alignItems="center">
            <SelectableTestItem
              name="selectAll"
              indeterminate={someSelected}
              checked={allSelected}
              onChange={handleSelectAll}
            />
            <StyledSearchField
              field={{
                value: searchQuery.search,
                onChange: handleChangeSearchQuery,
              }}
              placeholder={searchFieldPlaceholder}
              name="search"
            />
          </Box>
          <FormSeparatorLine />
          <SelectorTable>
            {showLoadingText && <BodyText>Loading {selectableName}s</BodyText>}
            {!showLoadingText &&
              (queriedData.length > 0 ? (
                queriedData.map(selectable => (
                  <SelectableTestItem
                    key={`${selectable.id}-checkbox`}
                    label={selectable.name}
                    name={selectable.id}
                    category={selectable.category?.name}
                    checked={isSelected(selectable)}
                    onChange={handleSelect}
                  />
                ))
              ) : (
                <BodyText>No {selectableName}s found.</BodyText>
              ))}
          </SelectorTable>
        </SelectorContainer>
        <SelectorContainer>
          <Box display="flex" justifyContent="space-between">
            <SectionHeader>Selected {selectableName}s</SectionHeader>
            {value.length > 0 && <ClearAllButton onClick={handleClear}>Clear all</ClearAllButton>}
          </Box>
          <FormSeparatorLine />
          <SelectorTable>
            {selected.map(option => {
              return (
                <TestItem
                  key={`${option.id}-selected`}
                  label={option.name}
                  name={option.id}
                  category={option.category?.name}
                  onRemove={handleSelect}
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
