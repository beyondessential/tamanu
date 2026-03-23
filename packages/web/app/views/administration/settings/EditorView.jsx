import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { capitalize, cloneDeep, get, omitBy, pickBy, set, startCase } from 'lodash';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import { DynamicSelectField, TranslatedText } from '../../../components';
import { SelectInput, OutlinedButton, Button } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
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

const UNCATEGORISED_KEY = 'uncategorised';

export const formatSettingName = (name, path) => name || capitalize(startCase(path));

const recursiveJsonParse = obj => {
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

const prepareSchema = scope => {
  const rawSchema = getScopedSchema(scope);
  const schema = { ...rawSchema, properties: { ...rawSchema.properties } };
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
  if (!categorySchema) return null;
  const subCategories = omitBy(categorySchema.properties, isSetting);
  return Object.keys(subCategories).length > 1
    ? getCategoryOptions({ properties: subCategories })
    : null;
};

const getCategoryOptions = schema =>
  Object.entries(schema.properties)
    .map(([key, value]) => ({
      value: key,
      label: formatSettingName(value.name, key),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
    jumpToPath,
    onJumpComplete,
  }) => {
    const { facilityId } = values;
    const [category, setCategory] = useState(null);
    const [subCategory, setSubCategory] = useState(null);
    const [scrollToPath, setScrollToPath] = useState(null);

    const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
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
    };

    useEffect(handleChangeScope, [scope]);

    // When jumpToPath changes (set by clicking a search result), navigate to the correct
    // category/sub-category and then scroll to the specific setting row.
    useEffect(() => {
      if (!jumpToPath) return;

      const jumpSchema = prepareSchema(scope);

      // The path looks like "category.subCategory.settingKey" or "category.settingKey"
      // We need to find which top-level category key and optional sub-category key to select,
      // then derive the relative path that Category receives (with the prefix stripped).
      const parts = jumpToPath.split('.');

      // Top-level category is always parts[0], unless it is uncategorised (i.e. a direct leaf)
      const topKey = parts[0];
      const schemaTopLevel = jumpSchema.properties[topKey];

      let resolvedCategory;
      let resolvedSubCategory = null;
      // The relative path passed to Category starts after the category (and subCategory) prefix.
      // Category renders each setting with the path relative to its own root.
      let relativePath;

      if (!schemaTopLevel) {
        // Path belongs to an uncategorised top-level setting
        resolvedCategory = UNCATEGORISED_KEY;
        relativePath = jumpToPath;
      } else {
        resolvedCategory = topKey;

        // A sub-category selector is shown when there are multiple non-leaf nodes directly under
        // the top category. Check whether parts[1] is one of those sub-category keys.
        if (parts.length > 2) {
          const subKey = parts[1];
          const availableSubCategories = getSubCategoryOptions(jumpSchema, topKey);
          if (availableSubCategories?.some(opt => opt.value === subKey)) {
            resolvedSubCategory = subKey;
            // Relative path for Category is everything after "topKey.subKey."
            relativePath = parts.slice(2).join('.');
          } else {
            // No sub-category selector; relative path is everything after "topKey."
            relativePath = parts.slice(1).join('.');
          }
        } else {
          // Only one level deep inside the category
          relativePath = parts.slice(1).join('.');
        }
      }

      setCategory(resolvedCategory);
      setSubCategory(resolvedSubCategory);
      // Use the relative path so ScrollableSettingLine can match settingPath === scrollToPath
      setScrollToPath(relativePath);
    }, [jumpToPath, scope]);

    const handleScrollComplete = useCallback(() => {
      setScrollToPath(null);
      onJumpComplete?.();
    }, [onJumpComplete]);

    const handleChangeCategory = async e => {
      const newCategory = e.target.value;
      if (newCategory !== category && dirty) {
        const dismissChanges = await handleShowWarningModal();
        if (!dismissChanges) return;
        await resetForm();
      }
      setSubCategory(null);
      setCategory(newCategory);
    };

    const handleChangeSubcategory = e => {
      setSubCategory(e.target.value);
    };

    const getSettingPath = path =>
      `${category === UNCATEGORISED_KEY ? '' : `${category}.`}${subCategory ? `${subCategory}.` : ''}${path}`;

    const handleChangeSetting = (path, value) => {
      const settingObject = cloneDeep(values.settings);
      const updatedSettings = set(settingObject, getSettingPath(path), value);
      setFieldValue('settings', updatedSettings);
    };

    const getSettingValue = path => get(values.settings, getSettingPath(path));

    const saveSettings = async event => {
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
            <Box display="flex" alignItems="center" data-testid="box-e25e">
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
                <Box ml={2} data-testid="box-o82k">
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
                </Box>
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
                scrollToPath={scrollToPath}
                onScrollComplete={handleScrollComplete}
                data-testid="category-cbjk"
              />
            </CategoriesWrapper>
          )}
        </SettingsWrapper>
      </>
    );
  },
);
