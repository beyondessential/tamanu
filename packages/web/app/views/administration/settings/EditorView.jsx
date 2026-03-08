import React, { memo, useEffect, useMemo, useState } from 'react';
import { capitalize, cloneDeep, get, omitBy, pickBy, set, startCase } from 'lodash';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import {
  DynamicSelectField,
  OuterLabelFieldWrapper,
  TranslatedText,
  SearchInput,
} from '../../../components';
import { SelectInput, OutlinedButton, Button } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { useTranslation } from '../../../contexts/Translation';
import { Category } from './components/Category';

const SettingsWrapper = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  margin-top: 1.25rem;
`;

const StyledDynamicSelectField = styled(DynamicSelectField)`
  width: 18.75rem;
`;

const StyledSelectInput = styled(SelectInput)`
  width: 18.75rem;
`;

const CategoryOptions = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: end;
`;

const CategoriesWrapper = styled.div`
  display: grid;
  column-gap: 1rem;
  grid-template-columns: minmax(min-content, 30rem) minmax(min-content, max-content);
  padding: 1.25rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const SearchWrapper = styled.div`
  position: relative;
  width: 18.75rem;
  padding-right: 1rem;
`;

const SearchResultsDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  max-height: 20rem;
  overflow-y: auto;
  background: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1;
`;

const SearchResultItem = styled.button`
  width: 100%;
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  &:hover {
    background: ${Colors.background};
  }
  &:not(:last-child) {
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const SearchResultLabel = styled.div`
  font-weight: 500;
`;

const SearchResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
`;

const SearchResultTypeBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: ${Colors.softText};
  padding: 0.125rem 0.375rem;
  background: ${Colors.background};
  border-radius: 3px;
`;

const SearchResultBreadcrumb = styled.span`
  font-size: 11px;
  color: ${Colors.softText};
`;

const SearchResultDescription = styled.div`
  font-size: 12px;
  color: ${Colors.softText};
  margin-top: 0.25rem;
`;

const UNCATEGORISED_KEY = 'uncategorised';

export const formatSettingName = (name, path) => name || capitalize(startCase(path));

const recursiveJsonParse = (obj) => {
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(recursiveJsonParse);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object') {
        acc[key] = parsed;
      } else {
        acc[key] = value;
      }
    } catch {
      acc[key] = recursiveJsonParse(value);
    }
    return acc;
  }, {});
};

const prepareSchema = (scope) => {
  const schema = getScopedSchema(scope);
  const uncategorised = pickBy(schema.properties, isSetting);
  // If there are any top-level settings, move them to an uncategorised category
  if (Object.keys(uncategorised).length) {
    const categories = omitBy(schema.properties, isSetting);
    schema.properties = {
      ...categories,
      [UNCATEGORISED_KEY]: {
        properties: uncategorised,
      },
    };
  }
  return schema;
};

const getSchemaForCategory = (schema, category, subCategory) => {
  const categorySchema = schema.properties[category];
  if (!categorySchema) return null;
  if (subCategory) {
    // Pass down highRisk from parent category to now top level subcategory
    const subCategorySchema = categorySchema.properties[subCategory];
    const isHighRisk = categorySchema.highRisk || subCategorySchema.highRisk;
    return {
      ...subCategorySchema,
      highRisk: isHighRisk,
    };
  }
  return categorySchema;
};

const getSubCategoryOptions = (schema, category) => {
  const categorySchema = schema.properties[category];
  if (!categorySchema?.properties) return null;
  const subCategories = omitBy(categorySchema.properties, isSetting);
  const keys = Object.keys(subCategories);
  return keys.length >= 1 ? getCategoryOptions({ properties: subCategories }) : null;
};

const getCategoryOptions = (schema) =>
  Object.entries(schema.properties)
    .map(([key, value]) => ({
      value: key,
      label: formatSettingName(value.name, key),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

const SEARCH_RESULTS_LIMIT = 20;

const getEntryType = (path, isLeaf) => {
  if (isLeaf) return 'setting';
  const segmentCount = path.split('.').length;
  return segmentCount === 1 ? 'category' : 'subcategory';
};

const formatPathBreadcrumb = (path) =>
  path
    .split('.')
    .map((segment) => capitalize(startCase(segment)))
    .join(' › ');

const buildSearchIndex = (schema) => {
  if (!schema?.properties) return [];
  const entries = [];

  const walk = (properties, pathPrefix = '') => {
    Object.entries(properties).forEach(([key, value]) => {
      const path = pathPrefix ? `${pathPrefix}.${key}` : key;
      const label = formatSettingName(value.name, key);
      const description = value?.description ?? '';
      const isLeaf = isSetting(value);
      const type = getEntryType(path, isLeaf);
      const pathBreadcrumb = formatPathBreadcrumb(path);

      if (isLeaf) {
        entries.push({ path, label, description, type, pathBreadcrumb });
      } else {
        entries.push({ path, label, description, type, pathBreadcrumb });
        if (value?.properties) {
          walk(value.properties, path);
        }
      }
    });
  };

  walk(schema.properties);
  return entries;
};

const filterSearchIndex = (index, query) => {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  return index
    .filter(
      (entry) =>
        entry.type === 'setting' &&
        (entry.label?.toLowerCase().includes(q) ||
          entry.description?.toLowerCase().includes(q) ||
          entry.path?.toLowerCase().includes(q)),
    )
    .slice(0, SEARCH_RESULTS_LIMIT);
};

export const EditorView = memo(
  ({
    values,
    setValues,
    setFieldValue,
    submitForm,
    resetForm,
    isSubmitting,
    dirty,
    handleShowWarningModal,
    scope,
  }) => {
    const { facilityId } = values;
    const { getTranslation } = useTranslation();
    const [category, setCategory] = useState(null);
    const [subCategory, setSubCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
    const searchIndex = useMemo(() => buildSearchIndex(scopedSchema), [scopedSchema]);
    const searchResults = useMemo(
      () => filterSearchIndex(searchIndex, searchQuery),
      [searchIndex, searchQuery],
    );
    const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
    const subCategoryOptions = useMemo(
      () => getSubCategoryOptions(scopedSchema, category),
      [category, scopedSchema],
    );
    const schemaForCategory = useMemo(
      () => getSchemaForCategory(scopedSchema, category, subCategory),
      [scopedSchema, category, subCategory],
    );

    const handleChangeScope = () => {
      setSubCategory(null);
      setCategory(null);
      setSearchQuery('');
    };

    useEffect(handleChangeScope, [scope]);

    const handleSelectResult = async (entry) => {
      const pathParts = entry.path.split('.');
      const newCategory = pathParts[0];
      const categorySchema = scopedSchema?.properties?.[newCategory];
      const secondSegment = pathParts.length >= 2 ? pathParts[1] : null;
      const isSecondSegmentSubCategory =
        secondSegment &&
        categorySchema?.properties?.[secondSegment] &&
        !isSetting(categorySchema.properties[secondSegment]);
      const newSubCategory = secondSegment && isSecondSegmentSubCategory ? secondSegment : null;

      if (newCategory !== category || newSubCategory !== subCategory) {
        if (dirty) {
          const dismissChanges = await handleShowWarningModal();
          if (!dismissChanges) return;
          await resetForm();
        }
        setCategory(newCategory);
        setSubCategory(newSubCategory);
      }

      setSearchQuery('');
    };

    const handleChangeCategory = async (e) => {
      const newCategory = e.target.value;
      if (newCategory !== category && dirty) {
        const dismissChanges = await handleShowWarningModal();
        if (!dismissChanges) return;
        await resetForm();
      }
      setSubCategory(null);
      setCategory(newCategory);
    };

    const handleChangeSubcategory = (e) => {
      setSubCategory(e.target.value);
    };

    const getSettingPath = (path) =>
      `${category === UNCATEGORISED_KEY ? '' : `${category}.`}${subCategory ? `${subCategory}.` : ''
      }${path}`;

    const handleChangeSetting = (path, value) => {
      const settingObject = cloneDeep(values.settings);
      const updatedSettings = set(settingObject, getSettingPath(path), value);
      setFieldValue('settings', updatedSettings);
    };

    const getSettingValue = (path) => get(values.settings, getSettingPath(path));

    const saveSettings = async (event) => {
      // Need to parse json string objects stored in keys
      const parsedSettings = recursiveJsonParse(values.settings);
      delete parsedSettings.uncategorised;
      setValues({ ...values, settings: parsedSettings });
      const success = await submitForm(event);
      if (success) {
        resetForm({ values });
      }
    };

    return (
      <>
        <SettingsWrapper data-testid="settingswrapper-bfnb">
          <CategoryOptions p={2} data-testid="categoryoptions-0h2x">
            <Box display="flex" alignItems="center" gap={2} data-testid="box-e25e">
              <SearchWrapper data-testid="search-wrapper">
                <OuterLabelFieldWrapper
                  label={
                    <TranslatedText
                      stringId="admin.settings.search.placeholder"
                      fallback="Search settings"
                      data-testid="translatedtext-search-label"
                    />
                  }
                  data-testid="settings-search-label-wrapper"
                >
                  <SearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => setSearchQuery('')}
                    data-testid="settings-search-input"
                  />
                {searchResults.length > 0 && (
                  <SearchResultsDropdown data-testid="settings-search-results">
                    {searchResults.map((entry) => (
                      <SearchResultItem
                        key={entry.path}
                        type="button"
                        onClick={() => handleSelectResult(entry)}
                        data-testid={`settings-search-result-${entry.path.replace(/\./g, '-')}`}
                      >
                        <SearchResultLabel>{entry.label}</SearchResultLabel>
                        <SearchResultMeta>
                          <SearchResultTypeBadge>
                            {getTranslation(
                              `admin.settings.search.type.${entry.type}`,
                              entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
                            )}
                          </SearchResultTypeBadge>
                          <SearchResultBreadcrumb>{entry.pathBreadcrumb}</SearchResultBreadcrumb>
                        </SearchResultMeta>
                        {entry.description ? (
                          <SearchResultDescription>{entry.description}</SearchResultDescription>
                        ) : null}
                      </SearchResultItem>
                    ))}
                  </SearchResultsDropdown>
                )}
                </OuterLabelFieldWrapper>
              </SearchWrapper>
              <StyledSelectInput
                required
                placeholder=""
                label={
                  <TranslatedText
                    stringId="admin.settings.category.label"
                    fallback="Select category"
                    data-testid="translatedtext-65vi"
                  />
                }
                value={category}
                onChange={handleChangeCategory}
                options={categoryOptions}
                data-testid="styledselectinput-kvyx"
              />
              {subCategoryOptions && (
                <StyledDynamicSelectField
                  label={
                    <TranslatedText
                      stringId="admin.settings.subCategory.label"
                      fallback="Select sub-category"
                      data-testid="translatedtext-i0zl"
                    />
                  }
                  placeholder=""
                  value={subCategory}
                  onChange={handleChangeSubcategory}
                  options={subCategoryOptions}
                  data-testid="styleddynamicselectfield-d62r"
                />
              )}
            </Box>
            <ButtonGroup data-testid="buttongroup-oe3l">
              <OutlinedButton
                onClick={() => resetForm()}
                disabled={!dirty}
                data-testid="outlinedbutton-mhaq"
              >
                <TranslatedText
                  stringId="admin.settings.action.clearChanges"
                  fallback="Clear changes"
                  data-testid="translatedtext-pj7p"
                />
              </OutlinedButton>
              <Button
                onClick={saveSettings}
                disabled={!dirty || isSubmitting}
                data-testid="button-s1z4"
              >
                <TranslatedText
                  stringId="admin.settings.action.saveChanges"
                  fallback="Save changes"
                  data-testid="translatedtext-yd0s"
                />
              </Button>
            </ButtonGroup>
          </CategoryOptions>
          <Divider data-testid="divider-tp55" />
          {category && (
            <CategoriesWrapper p={2} data-testid="categorieswrapper-0ae4">
              <Category
                schema={schemaForCategory}
                getSettingValue={getSettingValue}
                handleChangeSetting={handleChangeSetting}
                facilityId={facilityId}
                data-testid="category-cbjk"
              />
            </CategoriesWrapper>
          )}
        </SettingsWrapper>
      </>
    );
  },
);
