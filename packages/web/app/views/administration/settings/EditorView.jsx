import React, { memo, useMemo, useState } from 'react';
import { capitalize, omitBy, pickBy, startCase, set, get, cloneDeep, isEqual } from 'lodash';
import styled from 'styled-components';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import {
  Heading4,
  SelectInput,
  TranslatedText,
  LargeBodyText,
  Button,
  OutlinedButton,
} from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { Box, Divider } from '@material-ui/core';
import { SettingInput } from './SettingInput';
import { ConfirmModal } from '../../../components/ConfirmModal';

const INDENT_WIDTH_PX = 20;
const LONG_TEXT_KEYS = ['body'];

const SettingsWrapper = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  margin-top: 20px;
`;

const StyledTopBar = styled.div`
  display: flex;
`;

const StyledSelectInput = styled(SelectInput)`
  width: 300px;
`;

const SettingLine = styled(LargeBodyText)`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  width: 600px;
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

const CategoryWrapper = styled.div`
  // margin-left: ${({ $nestLevel }) => $nestLevel * INDENT_WIDTH_PX}px;
  :not(:first-child) {
    padding-top: 20px;
    border-top: 1px solid ${Colors.outline};
  }
`;

const getName = (name, path) => name || capitalize(startCase(path.split('.').pop()));

const CategoryTitle = ({ name, path, description }) => {
  const categoryTitle = getName(name, path);
  if (!categoryTitle) return null;
  return (
    <ThemedTooltip placement="top" arrow title={description}>
      <Heading4 width="fit-content" mt={0} mb={2}>
        {categoryTitle}
      </Heading4>
    </ThemedTooltip>
  );
};

const SettingName = ({ name, path, description }) => (
  <ThemedTooltip arrow placement="top" title={description}>
    <LargeBodyText ml={1} mr="auto" width="fit-content">
      {getName(name, path)}
    </LargeBodyText>
  </ThemedTooltip>
);

const sortProperties = ([a0, a1], [b0, b1]) => {
  const aName = a1.name || a0;
  const bName = b1.name || b0;
  const isTopLevelA = isSetting(a1);
  const isTopLevelB = isSetting(b1);
  // Sort top level settings first
  if (isTopLevelA && !isTopLevelB) return -1;
  if (!isTopLevelA && isTopLevelB) return 1;
  // Alphabetical sort
  return aName.localeCompare(bName);
};

export const Category = ({ values, path = '', getSettingValue, handleChangeSetting }) => {
  const Wrapper = path ? CategoryWrapper : Box;
  const nestLevel = path.split('.').length;
  const sortedProperties = Object.entries(values.properties).sort(sortProperties);
  return (
    <Wrapper $nestLevel={nestLevel}>
      <CategoryTitle name={values.name} path={path} description={values.description} />
      <div>
        {sortedProperties.map(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          const { name, description, type, defaultValue, unit } = value;
          return type ? (
            <SettingLine key={newPath}>
              <SettingName path={newPath} name={name} description={description} />
              <SettingInput
                type={LONG_TEXT_KEYS.includes(key) ? 'longText' : type.type}
                value={getSettingValue(newPath)}
                defaultValue={defaultValue}
                path={newPath}
                handleChangeSetting={handleChangeSetting}
                unit={unit}
              />
            </SettingLine>
          ) : (
            <Category
              key={newPath}
              path={newPath}
              values={value}
              getSettingValue={getSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          );
        })}
      </div>
    </Wrapper>
  );
};

function parseJsonStrings(obj) {
  if (typeof obj === 'string') {
    try {
      const parsed = JSON.parse(obj);
      return parseJsonStrings(parsed);
    } catch (e) {
      return obj; // Return the string if it is not a valid JSON
    }
  } else if (Array.isArray(obj)) {
    return obj.map(parseJsonStrings);
  } else if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = parseJsonStrings(obj[key]);
      return acc;
    }, {});
  } else {
    return obj; // Return the value if it is neither an object nor a string
  }
}

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

export const EditorView = memo(({ values, setValues, submitForm, settingsSnapshot, resetForm }) => {
  const { scope } = values;
  const [category, setCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false); // Control modal visibility
  const [resolveFn, setResolveFn] = useState(null);

  const hasPendingEdits = values.settings && !isEqual(settingsSnapshot, values.settings);

  const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
  const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
  const initialValues = useMemo(() => scopedSchema.properties[category], [category, scopedSchema]);

  const handleChangeScope = () => setCategory(null);
  const handleChangeCategory = async e => {
    if (hasPendingEdits) {
      const confirmed = await new Promise(resolve => {
        setResolveFn(() => resolve); // Save resolve to use in onConfirm/onCancel
        setModalOpen(true); // Open modal
      });

      if (!confirmed) return;
      await resetForm();
    }
    setCategory(e.target.value);
  };

  const handleChangeSetting = (path, value) => {
    const settingObject = cloneDeep(values.settings || settingsSnapshot);
    const updatedSettings = set(settingObject, `${category}.${path}`, value);
    setValues({ ...values, settings: updatedSettings });
  };
  const getSettingValue = path => get(values.settings || settingsSnapshot, `${category}.${path}`);

  const saveSettings = async event => {
    const parsedObject = parseJsonStrings(values.settings);
    setValues({ ...values, settings: parsedObject });
    await submitForm(event);
    // TODO: this causes flashing when reseting to the same value
    await resetForm();
  };

  return (
    <>
      {/* TODO: translations */}
      <ConfirmModal
        title="Unsaved changes"
        subText="You have unsaved changes. Are you sure you would like to discard those changes?"
        open={modalOpen}
        onConfirm={() => {
          setModalOpen(false);
          resolveFn(true);
        }}
        confirmButtonText="Discard changes"
        onCancel={() => {
          setModalOpen(false);
          resolveFn(false);
        }}
        cancelButtonText="Go back"
      />
      <StyledTopBar>
        <ScopeSelectorFields onChangeScope={handleChangeScope} />
      </StyledTopBar>
      <SettingsWrapper>
        <CategoryOptions p={2}>
          <StyledSelectInput
            required
            label={<TranslatedText stringId="admin.settings.category" fallback="Category" />}
            value={category}
            onChange={handleChangeCategory}
            options={categoryOptions}
          />
          <div>
            <OutlinedButton onClick={resetForm} disabled={!hasPendingEdits}>
              Clear changes
            </OutlinedButton>
            <SubmitButton onClick={saveSettings} disabled={!hasPendingEdits}>
              Save changes
            </SubmitButton>
          </div>
        </CategoryOptions>
        <Divider />
        {category && (
          <CategoriesWrapper p={2}>
            <Category
              values={initialValues}
              getSettingValue={getSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          </CategoriesWrapper>
        )}
      </SettingsWrapper>
    </>
  );
});
