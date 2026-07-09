import React, { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  cloneDeep,
  get,
  isEqual,
  isPlainObject,
  omitBy,
  pickBy,
  set,
} from 'es-toolkit/compat';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';

import { useFormikContext } from 'formik';
import { SETTINGS_SCOPES } from '@tamanu/constants';
import { getScopedSchema, isSetting } from '@tamanu/settings/schema';

import { DynamicSelectField, SearchInput, TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { SelectInput, OutlinedButton, Button } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { Category } from './components/Category';
import { SettingsSubmitContext } from './components/SettingsSubmitContext';
import { filterSettingsSchema } from './filterSettingsSchema';
import { formatSettingName } from './formatSettingName';
import { readUrlParam, writeUrlParams } from './urlState';
import { notifyError } from '../../../utils';

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

const StyledSearchInput = styled(SearchInput)`
  flex: 0 1 18.75rem;
  min-width: 11rem;
`;

const SearchAndActions = styled.div`
  align-items: center;
  display: flex;
  gap: 1.5rem;
  margin-left: auto;
`;

const NoSearchResults = styled(Box)`
  padding: 1.25rem;
  color: ${Colors.midText};
`;

const CategoryOptions = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
`;

const CategoriesWrapper = styled.div`
  display: grid;
  column-gap: 1rem;
  // Three columns shared (via subgrid) by every row: label | input | actions.
  // The label track flexes to fill, pushing the input and its reset action to
  // the right and giving every input/action a common column edge — so a narrow
  // number input and a wide text input still line up, and reset buttons align.
  grid-template-columns: minmax(min-content, 1fr) max-content max-content;
  // no padding: rows, headings and group separators run flush to the borders;
  // each row's own padding (see Category) insets the text within its band
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-shrink: 0;
  white-space: nowrap;
`;

const UNCATEGORISED_KEY = 'uncategorised';

// a single character matches half the schema
const MIN_SEARCH_LENGTH = 2;

const SCOPE_LABELS = {
  [SETTINGS_SCOPES.GLOBAL]: 'Global',
  [SETTINGS_SCOPES.CENTRAL]: 'Central',
  [SETTINGS_SCOPES.FACILITY]: 'Facility',
};

const NoResultsHint = styled.div`
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.7;
`;

const countSettings = schema =>
  Object.values(schema.properties ?? {}).reduce(
    (total, node) => total + (isSetting(node) || !node.properties ? 1 : countSettings(node)),
    0,
  );


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

// Group any top-level settings under a synthetic category; it's not offered
// in the category dropdown but shown whenever no category is selected. Copies
// rather than mutates: the scoped schema is a shared singleton, and moving its
// root leaves in place corrupts every later schema walk (applyDefaults,
// validation), which then resolve those settings to undefined.
const prepareSchema = scope => {
  const schema = getScopedSchema(scope);
  const uncategorised = pickBy(schema.properties, isSetting);
  if (Object.keys(uncategorised).length === 0) return schema;
  return {
    ...schema,
    properties: {
      ...omitBy(schema.properties, isSetting),
      [UNCATEGORISED_KEY]: {
        properties: uncategorised,
      },
    },
  };
};

// The synthetic root group renders untitled; a real category falls back to its
// key when the schema has no display name, so leaf-only categories (with no
// nested headings) still show what they are.
const withDisplayName = (node, key) =>
  key === UNCATEGORISED_KEY ? node : { ...node, name: node.name ?? formatSettingName(null, key) };

const getSchemaForCategory = (schema, category, subCategory) => {
  const categorySchema = schema.properties[category];
  if (!categorySchema) return null;
  if (subCategory) {
    const subCategorySchema = categorySchema.properties[subCategory];
    const isHighRisk = categorySchema.highRisk || subCategorySchema.highRisk;
    const infoBanner = categorySchema.infoBanner || subCategorySchema.infoBanner;
    const needsRestart = categorySchema.requiresRestart || subCategorySchema.requiresRestart;
    return {
      ...withDisplayName(subCategorySchema, subCategory),
      highRisk: isHighRisk,
      infoBanner,
      requiresRestart: needsRestart,
    };
  }
  return withDisplayName(categorySchema, category);
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

// A field cleared to "no override" is stored as `undefined` (lodash set leaves the
// key present), so strip undefined leaves and now-empty objects before comparing —
// matching an initial state where the key was simply absent.
const stripEmpty = value => {
  if (!isPlainObject(value)) return value;
  return Object.entries(value).reduce((acc, [key, val]) => {
    if (val === undefined) return acc;
    const stripped = stripEmpty(val);
    if (isPlainObject(stripped) && Object.keys(stripped).length === 0) return acc;
    acc[key] = stripped;
    return acc;
  }, {});
};

export const EditorView = memo(
  ({
    values,
    setValues,
    setFieldValue,
    submitForm,
    resetForm,
    isSubmitting,
    handleShowWarningModal,
    scope,
    globalSettings,
  }) => {
    const { facilityId } = values;
    const { initialValues } = useFormikContext();
    const { getTranslation } = useTranslation();
    // Selection, search, and the overrides filter are deep-linkable (see
    // urlState.js); an invalid category/sub-category param is just dropped.
    const [category, setCategory] = useState(() => {
      const fromUrl = readUrlParam('category');
      return fromUrl && fromUrl in (getScopedSchema(scope)?.properties ?? {}) ? fromUrl : null;
    });
    const [subCategory, setSubCategory] = useState(() => {
      const fromUrl = readUrlParam('subCategory');
      const parent = readUrlParam('category');
      return fromUrl && getScopedSchema(scope)?.properties?.[parent]?.properties?.[fromUrl]
        ? fromUrl
        : null;
    });
    const [searchQuery, setSearchQuery] = useState(() => readUrlParam('q') ?? '');
    const [failedSubmits, setFailedSubmits] = useState(0);

    useEffect(() => {
      writeUrlParams({ category, subCategory, q: searchQuery });
    }, [category, subCategory, searchQuery]);
    // defer filtering so broad queries don't freeze typing
    const deferredSearchQuery = useDeferredValue(searchQuery);
    // drives the rendered body; lags the input while a deferred render is pending
    const isSearchRender = deferredSearchQuery.trim().length >= MIN_SEARCH_LENGTH;

    // Real changes only: a value returned to its inherited/default (stored as
    // undefined) is not a change, unlike Formik's built-in `dirty`.
    const hasChanges = useMemo(
      () => !isEqual(stripEmpty(values.settings), stripEmpty(initialValues?.settings)),
      [values.settings, initialValues],
    );

    const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
    // No category selected -> show the top-level settings (when the scope has any)
    const effectiveCategory =
      category ?? (UNCATEGORISED_KEY in scopedSchema.properties ? UNCATEGORISED_KEY : null);
    const categoryOptions = useMemo(
      () => getCategoryOptions(scopedSchema).filter(option => option.value !== UNCATEGORISED_KEY),
      [scopedSchema],
    );
    const subCategoryOptions = useMemo(
      () => getSubCategoryOptions(scopedSchema, effectiveCategory),
      [effectiveCategory, scopedSchema],
    );
    const schemaForCategory = useMemo(
      () => getSchemaForCategory(scopedSchema, effectiveCategory, subCategory),
      [scopedSchema, effectiveCategory, subCategory],
    );

    // Search within the selection when a category is chosen, across everything
    // otherwise (filtering the raw scoped schema, not prepareSchema's copy, so
    // root-level settings keep their real paths). Null when nothing matches.
    const searchResult = useMemo(() => {
      if (!isSearchRender) return null;
      const baseSchema = category ? schemaForCategory : getScopedSchema(scope);
      if (!baseSchema) return null;
      const filtered = filterSettingsSchema(baseSchema, deferredSearchQuery);
      // the scope root's name ("Central server settings") is not a category
      // heading — drop it for unscoped results
      if (!filtered || category) return filtered;
      const rootWithoutName = { ...filtered.schema };
      delete rootWithoutName.name;
      return { ...filtered, schema: rootWithoutName };
    }, [isSearchRender, category, schemaForCategory, scope, deferredSearchQuery]);

    // When nothing matched, say where matches DO exist — the schemas are
    // disjoint per scope, so "no results" here often just means "wrong scope".
    const searchHints = useMemo(() => {
      if (!isSearchRender || searchResult) return null;
      const hints = [];
      if (category) {
        const wholeScope = filterSettingsSchema(getScopedSchema(scope), deferredSearchQuery);
        if (wholeScope) hints.push(`${countSettings(wholeScope.schema)} elsewhere in this scope`);
      }
      for (const other of Object.values(SETTINGS_SCOPES)) {
        if (other === scope) continue;
        const otherSchema = getScopedSchema(other);
        if (!otherSchema) continue;
        const filtered = filterSettingsSchema(otherSchema, deferredSearchQuery);
        if (filtered) {
          hints.push(`${countSettings(filtered.schema)} in the ${SCOPE_LABELS[other]} scope`);
        }
      }
      return hints.length ? hints : null;
    }, [isSearchRender, searchResult, category, scope, deferredSearchQuery]);

    const handleChangeScope = () => {
      setSubCategory(null);
      setCategory(null);
      setSearchQuery('');
    };

    // Reset the selection when the scope changes — but not on mount, or the
    // deep-linked state read from the URL would be immediately clobbered.
    const isFirstRender = useRef(true);
    useEffect(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      handleChangeScope();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope]);

    const handleChangeCategory = async e => {
      const newCategory = e.target.value ?? null; // null when cleared via the x
      if (newCategory !== category && hasChanges) {
        const dismissChanges = await handleShowWarningModal();
        if (!dismissChanges) return;
        await resetForm();
      }
      // picking a category is a fresh intent — drop any active query
      setSearchQuery('');
      setSubCategory(null);
      setCategory(newCategory);
      setFailedSubmits(0);
    };

    const handleChangeSubcategory = e => {
      setSearchQuery('');
      setSubCategory(e.target.value);
    };

    // Unscoped search renders from the schema root, so paths are already
    // complete; the category view and scoped search need the selection prefixed.
    const getSettingPath = path =>
      isSearchRender && !category
        ? path
        : `${effectiveCategory === UNCATEGORISED_KEY ? '' : `${effectiveCategory}.`}${
            subCategory ? `${subCategory}.` : ''
          }${path}`;

    const handleChangeSetting = (path, value) => {
      const settingObject = cloneDeep(values.settings);
      const updatedSettings = set(settingObject, getSettingPath(path), value);
      setFieldValue('settings', updatedSettings);
    };

    const getSettingValue = path => get(values.settings, getSettingPath(path));

    const getGlobalSettingValue = globalSettings
      ? path => get(globalSettings, getSettingPath(path))
      : undefined;

    const saveSettings = async event => {
      // Need to parse json string objects stored in keys
      const parsedSettings = recursiveJsonParse(values.settings);
      delete parsedSettings.uncategorised;
      const submittedValues = { ...values, settings: parsedSettings };
      setValues(submittedValues);
      const result = await submitForm(event);
      if (result?.validationError) {
        setFailedSubmits(count => count + 1);
        // errors render inline once submitCount bumps; wait a beat for that
        // render to flush, then bring the first into view
        setTimeout(() => {
          const firstError = document.querySelector(
            '.Mui-error, [data-error-anchor], [data-testid$="-error"], [data-testid$="-duplicates"], [data-testid*="-itemerror"]',
          );
          if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            // the invalid setting is in another category
            const { validationError } = result;
            (validationError.inner?.length ? validationError.inner : [validationError]).forEach(
              e =>
                notifyError(e.message.length > 160 ? `${e.message.slice(0, 160)}…` : e.message),
            );
          }
        }, 100);
        return;
      }
      if (result) {
        setFailedSubmits(0);
        resetForm({
          values: {
            ...submittedValues,
            settings: result.settings ?? submittedValues.settings,
          },
        });
      }
    };

    return (
      <SettingsWrapper data-testid="settingswrapper-bfnb">
        <CategoryOptions p={2} data-testid="categoryoptions-0h2x">
          <Box display="flex" alignItems="center" data-testid="box-e25e">
            <StyledSelectInput
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
          <SearchAndActions data-testid="searchandactions-s3ar">
            <StyledSearchInput
              placeholder={
                category
                  ? getTranslation('admin.settings.search.placeholderScoped', 'Search in category')
                  : getTranslation('admin.settings.search.placeholder', 'Search settings')
              }
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              data-testid="styledsearchinput-s3ar"
            />
          <ButtonGroup data-testid="buttongroup-oe3l">
            <OutlinedButton
              onClick={() => resetForm()}
              disabled={!hasChanges}
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
              disabled={!hasChanges || isSubmitting}
              data-testid="button-s1z4"
            >
              <TranslatedText
                stringId="admin.settings.action.saveChanges"
                fallback="Save changes"
                data-testid="translatedtext-yd0s"
              />
            </Button>
          </ButtonGroup>
          </SearchAndActions>
        </CategoryOptions>
        <Divider data-testid="divider-tp55" />
        {isSearchRender && !searchResult && (
          <NoSearchResults data-testid="nosearchresults-s3ar">
            <TranslatedText
              stringId="admin.settings.search.noResults"
              fallback="No settings match your search"
              data-testid="translatedtext-s3nr"
            />
            {searchHints && (
              <NoResultsHint data-testid="noresultshint-s3ar">
                <TranslatedText
                  stringId="admin.settings.search.matchesElsewhere"
                  fallback="Matches elsewhere:"
                  data-testid="translatedtext-mel1"
                />{' '}
                {searchHints.join(' · ')}
              </NoResultsHint>
            )}
          </NoSearchResults>
        )}
        {(isSearchRender ? searchResult?.schema : schemaForCategory) && (
          <CategoriesWrapper p={2} data-testid="categorieswrapper-0ae4">
            <SettingsSubmitContext.Provider value={failedSubmits}>
            <Category
              schema={isSearchRender ? searchResult.schema : schemaForCategory}
              getSettingValue={getSettingValue}
              getGlobalSettingValue={getGlobalSettingValue}
              resolveSettingsPath={getSettingPath}
              handleChangeSetting={handleChangeSetting}
              facilityId={facilityId}
              searchQuery={isSearchRender ? deferredSearchQuery : undefined}
              searchMeta={isSearchRender ? searchResult.meta : undefined}
              data-testid="category-cbjk"
            />
            </SettingsSubmitContext.Provider>
          </CategoriesWrapper>
        )}
      </SettingsWrapper>
    );
  },
);
