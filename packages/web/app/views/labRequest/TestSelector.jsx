import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { Box, capitalize, FormHelperText } from '@material-ui/core';
import { LAB_REQUEST_FORM_TYPES } from '@tamanu/constants/labs';
import { getReferenceDataStringId } from '@tamanu/shared/utils/translation';
import { useQuery } from '@tanstack/react-query';
import { subStrSearch } from '../../utils/subStringSearch';
import { Colors } from '../../constants';
import { useApi } from '../../api';
import { FormSeparatorLine } from '../../components/FormSeparatorLine';
import { SearchInput, SuggesterSelectField } from '../../components/Field';
import { TextButton } from '../../components/Button';
import { BodyText } from '../../components/Typography';
import { SelectableTestItem, TestItem } from './TestItem';
import { TranslatedReferenceData, TranslatedText } from '../../components/Translation';
import { useTranslation } from '../../contexts/Translation';

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

const StyledSearchInput = styled(SearchInput)`
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

const VerticalLine = styled.div`
  border-left: 1px solid ${Colors.outline};
  height: 100%;
`;

const useSelectable = formType => {
  const api = useApi();
  const endpoint = SELECTABLE_DATA_ENDPOINTS[formType];
  return useQuery([endpoint], () => api.get(endpoint), {
    placeholderData: [],
  });
};

const queryBySearch = (formType, data, { search, labTestCategoryId }, getTranslation) => {
  return data.filter(result => {
    const nameMatch = subStrSearch(search, result.name);
    if (formType === LAB_REQUEST_FORM_TYPES.PANEL) {
      const categoryName = getTranslation(
        getReferenceDataStringId(result.category?.id, result.category?.type),
        result.category?.name,
      );
      return nameMatch || subStrSearch(search, categoryName);
    }
    return nameMatch && (!labTestCategoryId || result.category.id === labTestCategoryId);
  });
};

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
  const { selectableName, label = labelConfig.subheading, searchFieldPlaceholder } = labelConfig;
  const { getTranslation } = useTranslation();
  const [searchQuery, setSearchQuery] = useState({
    labTestCategoryId: '',
    search: '',
  });

  const { data, isFetching } = useSelectable(requestFormType);
  const queriedData = queryBySearch(requestFormType, data, searchQuery, getTranslation).sort(
    sortByCategoryAndName,
  );

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

  const handleClearSearch = () => setSearchQuery({ ...searchQuery, search: '' });

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

  const getSearchFieldPlaceholder = () => {
    if (typeof searchFieldPlaceholder === 'object') {
      return getTranslation(searchFieldPlaceholder.stringId, searchFieldPlaceholder.fallback);
    }

    return searchFieldPlaceholder ?? getTranslation('general.placeholder.search', 'Search');
  };

  return (
    <Container data-testid="container-04yz">
      <LabelText data-testid="labeltext-79xr">{label}</LabelText>
      <Wrapper data-testid="wrapper-u8cg">
        <SelectorContainer data-testid="selectorcontainer-xky9">
          {requestFormType === LAB_REQUEST_FORM_TYPES.INDIVIDUAL && (
            <>
              <SuggesterSelectField
                field={{
                  value: searchQuery.labTestCategoryId,
                  onChange: handleChangeSearchQuery,
                  onClear: () => setSearchQuery({ ...searchQuery, search: '' }),
                }}
                label={
                  <TranslatedText
                    stringId="lab.testCategory.label"
                    fallback="Test category"
                    data-testid="translatedtext-0a6u"
                  />
                }
                endpoint="labTestCategory"
                name="labTestCategoryId"
                baseOptions={[
                  {
                    label: (
                      <TranslatedText
                        stringId="general.select.all"
                        fallback="All"
                        data-testid="translatedtext-am0x"
                      />
                    ),
                    value: '',
                  },
                ]}
                data-testid="suggesterselectfield-3mdo"
              />
              <FormSeparatorLine data-testid="formseparatorline-3j0n" />
            </>
          )}
          <TextTypeLabel data-testid="texttypelabel-3owb">
            {capitalize(selectableName)}s
          </TextTypeLabel>
          <Box display="flex" alignItems="center" data-testid="box-vnqq">
            <SelectableTestItem
              name="selectAll"
              indeterminate={someSelected}
              checked={allSelected}
              onChange={handleSelectAll}
              data-testid="selectabletestitem-k1uu"
            />
            <StyledSearchInput
              name="search"
              value={searchQuery.search}
              onChange={handleChangeSearchQuery}
              onClear={handleClearSearch}
              placeholder={getSearchFieldPlaceholder()}
              data-testid="styledsearchinput-92y3"
            />
          </Box>
          <FormSeparatorLine data-testid="formseparatorline-1waq" />
          <SelectorTable data-testid="selectortable-dwrp">
            {showLoadingText && (
              <BodyText data-testid="bodytext-ldne">Loading {selectableName}s</BodyText>
            )}
            {!showLoadingText &&
              (queriedData.length > 0 ? (
                queriedData.map(selectable => (
                  <SelectableTestItem
                    key={`${selectable.id}-checkbox`}
                    label={
                      <TranslatedReferenceData
                        category={
                          requestFormType === LAB_REQUEST_FORM_TYPES.INDIVIDUAL
                            ? 'labTestType'
                            : 'labTestPanel'
                        }
                        fallback={selectable.name}
                        value={selectable.id}
                        data-testid={`translatedreferencedata-zkjo-${selectable.code}`}
                      />
                    }
                    name={selectable.id}
                    category={
                      selectable.category?.name && (
                        <TranslatedReferenceData
                          fallback={selectable.category.name}
                          value={selectable.category.id}
                          category={selectable.category.type}
                          data-testid={`translatedreferencedata-gqmt-${selectable.code}`}
                        />
                      )
                    }
                    checked={isSelected(selectable)}
                    onChange={handleSelect}
                    data-testid={`selectabletestitem-sfbf-${selectable.code}`}
                  />
                ))
              ) : (
                <BodyText data-testid="bodytext-7zxj">
                  <TranslatedText
                    stringId="lab.testSelect.noData"
                    fallback="No :selectableName found."
                    replacements={{ selectableName }}
                    data-testid="translatedtext-test-selector-no-data"
                  />
                </BodyText>
              ))}
          </SelectorTable>
        </SelectorContainer>
        <VerticalLine data-testid="verticalline-n5vj" />
        <SelectorContainer data-testid="selectorcontainer-gewc">
          <Box display="flex" justifyContent="space-between" data-testid="box-x57a">
            <SectionHeader data-testid="sectionheader-r7n4">
              Selected {selectableName}s
            </SectionHeader>
            {value.length > 0 && (
              <ClearAllButton onClick={handleClear} data-testid="clearallbutton-ao0r">
                <TranslatedText
                  stringId="general.action.clearAll"
                  fallback="Clear all"
                  data-testid="translatedtext-to84"
                />
              </ClearAllButton>
            )}
          </Box>
          <FormSeparatorLine data-testid="formseparatorline-2m0r" />
          <SelectorTable data-testid="selectortable-6eaw">
            {selected.map(option => {
              return (
                <TestItem
                  key={`${option.id}-selected`}
                  label={
                    <TranslatedReferenceData
                      category={
                        requestFormType === LAB_REQUEST_FORM_TYPES.INDIVIDUAL
                          ? 'labTestType'
                          : 'labTestPanel'
                      }
                      fallback={option.name}
                      value={option.id}
                      data-testid={`translatedreferencedata-lv0m-${option.code}`}
                    />
                  }
                  name={option.id}
                  category={
                    option.category?.name && (
                      <TranslatedReferenceData
                        fallback={option.category.name}
                        value={option.category.id}
                        category={option.category.type}
                        data-testid={`translatedreferencedata-x0k0-${option.code}`}
                      />
                    )
                  }
                  onRemove={handleSelect}
                  data-testid={`testitem-wkzy-${option.code}`}
                />
              );
            })}
          </SelectorTable>
        </SelectorContainer>
      </Wrapper>
      {helperText && (
        <FormHelperText error={error} data-testid="formhelpertext-198r">
          {helperText}
        </FormHelperText>
      )}
    </Container>
  );
};

export const TestSelectorField = ({ field, ...props }) => (
  <TestSelectorInput
    name={field.name}
    value={field.value}
    onChange={field.onChange}
    {...props}
    data-testid="testselectorinput-v3d3"
  />
);
