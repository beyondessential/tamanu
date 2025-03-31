import React, { memo, useEffect, useMemo, useState } from 'react';
import { capitalize, cloneDeep, get, omitBy, pickBy, set, startCase } from 'lodash';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import {
  Button,
  DynamicSelectField,
  OutlinedButton,
  SelectInput,
  TranslatedText,
} from '../../../components';
import { Colors } from '../../../constants';
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
  }) => {
    const [category, setCategory] = useState(null);
    const [subCategory, setSubCategory] = useState(null);

    const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
    const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
    const subCategoryOptions = useMemo(() => getSubCategoryOptions(scopedSchema, category), [
      category,
      scopedSchema,
    ]);
    const schemaForCategory = useMemo(
      () => getSchemaForCategory(scopedSchema, category, subCategory),
      [scopedSchema, category, subCategory],
    );

    const handleChangeScope = () => {
      setSubCategory(null);
      setCategory(null);
    };

    useEffect(handleChangeScope, [scope]);

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
      `${category === UNCATEGORISED_KEY ? '' : `${category}.`}${
        subCategory ? `${subCategory}.` : ''
      }${path}`;

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
        <SettingsWrapper>
          <CategoryOptions p={2}>
            <Box display="flex" alignItems="center">
              <StyledSelectInput
                required
                placeholder=""
                label={
                  <TranslatedText
                    stringId="admin.settings.category.label"
                    fallback="Select category"
                    data-test-id='translatedtext-g4ty' />
                }
                value={category}
                onChange={handleChangeCategory}
                options={categoryOptions}
              />
              {subCategoryOptions && (
                <Box ml={2}>
                  <StyledDynamicSelectField
                    label={
                      <TranslatedText
                        stringId="admin.settings.subCategory.label"
                        fallback="Select sub-category"
                        data-test-id='translatedtext-2t47' />
                    }
                    placeholder=""
                    value={subCategory}
                    onChange={handleChangeSubcategory}
                    options={subCategoryOptions}
                  />
                </Box>
              )}
            </Box>
            <ButtonGroup>
              <OutlinedButton
                onClick={() => resetForm()}
                disabled={!dirty}
                data-test-id='outlinedbutton-qky5'>
                <TranslatedText
                  stringId="admin.settings.action.clearChanges"
                  fallback="Clear changes"
                  data-test-id='translatedtext-w9ze' />
              </OutlinedButton>
              <Button
                onClick={saveSettings}
                disabled={!dirty || isSubmitting}
                data-test-id='button-go9j'>
                <TranslatedText
                  stringId="admin.settings.action.saveChanges"
                  fallback="Save changes"
                  data-test-id='translatedtext-rpt7' />
              </Button>
            </ButtonGroup>
          </CategoryOptions>
          <Divider />
          {category && (
            <CategoriesWrapper p={2}>
              <Category
                schema={schemaForCategory}
                getSettingValue={getSettingValue}
                handleChangeSetting={handleChangeSetting}
              />
            </CategoriesWrapper>
          )}
        </SettingsWrapper>
      </>
    );
  },
);
