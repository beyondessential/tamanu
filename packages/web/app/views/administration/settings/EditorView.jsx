import React, { memo, useEffect, useMemo, useState } from 'react';
import { capitalize, omitBy, pickBy, startCase, set, get, cloneDeep } from 'lodash';
import styled from 'styled-components';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import { SelectInput, TranslatedText, Button, OutlinedButton } from '../../../components';
import { Colors } from '../../../constants';
import { Box, Divider } from '@material-ui/core';
import { Category } from './components/Category';

const SettingsWrapper = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  margin-top: 20px;
`;

const StyledSelectInput = styled(SelectInput)`
  width: 300px;
`;

const CategoryOptions = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubmitButton = styled(Button)`
  margin-left: 15px;
`;

const CategoriesWrapper = styled.div`
  padding: 20px;
`;

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

const getCategoryOptions = schema =>
  Object.entries(schema.properties).map(([key, value]) => ({
    value: key,
    label: value.name || capitalize(startCase(key)),
  }));

const prepareSchema = scope => {
  const schema = getScopedSchema(scope);
  const uncategorised = pickBy(schema.properties, isSetting);
  // If there are any top-level settings, move them to an uncategorised category
  if (Object.keys(uncategorised).length) {
    const categories = omitBy(schema.properties, isSetting);
    schema.properties = {
      ...categories,
      uncategorised: {
        properties: uncategorised,
      },
    };
  }
  return schema;
};

export const EditorView = memo(
  ({
    values,
    setFieldValue,
    submitForm,
    settingsSnapshot,
    resetForm,
    dirty,
    scope,
    handleShowWarningModal,
  }) => {
    const currentSettings = values.settings || settingsSnapshot;
    const [category, setCategory] = useState(null);
    const [subCategory, setSubCategory] = useState(null);

    const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
    const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
    const schemaForCategory = useMemo(() => scopedSchema.properties[category], [
      category,
      scopedSchema,
    ]);

    const subCategoryOptions = useMemo(() => {
      if (!category) return null;
      const subCategories = omitBy(scopedSchema.properties[category].properties, isSetting);
      return Object.keys(subCategories).length > 1
        ? getCategoryOptions({ properties: subCategories })
        : null;
    }, [category, scopedSchema.properties]);

    const handleChangeScope = () => {
      setCategory(null);
      setSubCategory(null);
    };

    useEffect(handleChangeScope, [scope]);

    const handleChangeCategory = async e => {
      const newCategory = e.target.value;
      if (newCategory !== category && dirty) {
        const dismissChanges = await handleShowWarningModal();
        if (!dismissChanges) return;
        await resetForm();
      }
      setCategory(newCategory);
    };

    const handleChangeSubcategory = async e => {
      const newCategory = e.target.value;
      if (newCategory !== category && dirty) {
        const dismissChanges = await handleShowWarningModal();
        if (!dismissChanges) return;
        await resetForm();
      }
      setSubCategory(newCategory);
    };

    const handleChangeSetting = (path, value) => {
      const settingObject = cloneDeep(currentSettings);
      const updatedSettings = set(settingObject, `${category}.${path}`, value);
      setFieldValue('settings', updatedSettings);
    };

    // Get initial value from snapshot, otherwise grab from current formik state once it exists
    const getSettingValue = path => get(currentSettings, `${category}.${path}`);

    const saveSettings = async event => {
      // Need to parse json string objects stored in keys
      const parsedSettings = recursiveJsonParse(values.settings);

      // TODO: figure out how to not save as uncategorised
      // const transformedSettings = {
      //   ...parsedSettings,
      //   ...parsedSettings.uncategorised
      // }

      // console.log(transformedSettings)
      // delete transformedSettings.uncategorised

      // console.log(transformedSettings)
      // TODO: move values.
      setFieldValue('settings', parsedSettings);
      const success = await submitForm(event);
      if (success) {
        setCategory(null);
        await resetForm();
      }
    };

    return (
      <>
        <SettingsWrapper>
          <CategoryOptions p={2}>
            <Box display="flex" alignItems="center">
              <StyledSelectInput
                label={<TranslatedText stringId="admin.settings.category" fallback="Category" />}
                value={category}
                onChange={handleChangeCategory}
                options={categoryOptions}
              />
              {subCategoryOptions && (
                <Box ml={2}>
                  <StyledSelectInput
                    label={
                      <TranslatedText
                        stringId="admin.settings.subCategory"
                        fallback="Sub category"
                      />
                    }
                    value={subCategory}
                    onChange={handleChangeSubcategory}
                    options={subCategoryOptions}
                  />
                </Box>
              )}
            </Box>
            <div>
              <OutlinedButton onClick={resetForm} disabled={!dirty}>
                <TranslatedText
                  stringId="admin.settings.action.clearChanges"
                  fallback="Clear changes"
                />
              </OutlinedButton>
              <SubmitButton onClick={saveSettings} disabled={!dirty}>
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
