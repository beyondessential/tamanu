import React, { memo, useEffect, useMemo, useState } from 'react';
import { capitalize, omitBy, pickBy, startCase, set, get, cloneDeep } from 'lodash';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import { TranslatedText, Button, OutlinedButton, DynamicSelectField } from '../../../components';
import { Colors } from '../../../constants';
import { Category } from './components/Category';

const SettingsWrapper = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  margin-top: 20px;
`;

const StyledDynamicSelectField = styled(DynamicSelectField)`
  width: 300px;
`;

const CategoryOptions = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: end;
`;

const SubmitButton = styled(Button)`
  margin-left: 15px;
`;

const CategoriesWrapper = styled.div`
  padding: 20px;
`;

const UNCATEGORISED_KEY = 'uncategorised';

export const formatSettingName = (name, path) => name || capitalize(startCase(path));

const recursiveJsonParse = obj => {
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(recursiveJsonParse);
  return Object.entries(obj).reduce((acc, [key, value]) => {
    try {
      acc[key] = JSON.parse(value);
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

    const checkDismissChanges = async () => {
      const dismissChanges = await handleShowWarningModal();
      if (dismissChanges) {
        await resetForm();
      }
      return dismissChanges;
    };

    const handleChangeCategory = async e => {
      setSubCategory(null);
      const newCategory = e.target.value;
      if (newCategory !== category && dirty) {
        const dismissed = await checkDismissChanges();
        if (!dismissed) return;
      }
      setCategory(newCategory);
    };

    const handleChangeSubcategory = async e => {
      const newSubCategory = e.target.value;
      if (newSubCategory !== subCategory && dirty) {
        const dismissed = await checkDismissChanges();
        if (!dismissed) return;
      }
      setSubCategory(newSubCategory);
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
      setValues({ ...values, settings: parsedSettings });
      const success = await submitForm(event);
      if (success) {
        await resetForm({ values });
      }
    };

    return (
      <>
        <SettingsWrapper>
          <CategoryOptions p={2}>
            <Box display="flex" alignItems="center">
              <StyledDynamicSelectField
                required
                placeholder=""
                label={
                  <TranslatedText
                    stringId="admin.settings.category.label"
                    fallback="Select category"
                  />
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
                      />
                    }
                    placeholder=""
                    value={subCategory}
                    onChange={handleChangeSubcategory}
                    options={subCategoryOptions}
                  />
                </Box>
              )}
            </Box>
            <div>
              <OutlinedButton onClick={() => resetForm()} disabled={!dirty}>
                <TranslatedText
                  stringId="admin.settings.action.clearChanges"
                  fallback="Clear changes"
                />
              </OutlinedButton>
              <SubmitButton onClick={saveSettings} disabled={!dirty || isSubmitting}>
                <TranslatedText
                  stringId="admin.settings.action.saveChanges"
                  fallback="Save changes"
                />
              </SubmitButton>
            </div>
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
