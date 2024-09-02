import React, { memo, useMemo, useState } from 'react';
import { capitalize, omitBy, pickBy, startCase, set, get } from 'lodash';
import styled from 'styled-components';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import {
  Heading4,
  SelectInput,
  TranslatedText,
  LargeBodyText,
  CheckInput,
  TextInput,
  NumberInput,
} from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { JSONEditor } from './JSONEditor';
import { Box, Divider, Switch } from '@material-ui/core';

const SettingsContainer = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  width: 500px;
  margin-top: 20px;
`;

const StyledTopBar = styled.div`
  padding: 0;
  display: flex;
`;

const StyledSelectInput = styled(SelectInput)`
  width: 300px;
`;

const StyledList = styled.div`
  & :not(:last-child) {
    margin-bottom: 20px;
  }
`;

const SettingLine = styled(LargeBodyText)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CategoriesContainer = styled.div`
  padding: 20px;
`;

const CategoryContainer = styled.div`
  margin-left: ${({ $levelNested }) => $levelNested * INDENT_NESTED_CATEGORY_BY}px;
  :not(:first-child) {
    padding-top: 20px;
    border-top: 1px solid ${Colors.outline};
  }
`;

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

const getName = (name, path) => {
  return name || capitalize(startCase(path.split('.').pop()));
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

const SettingInput = ({ type, handleChangeSetting, path, ...props }) => {
  switch (type) {
    case 'boolean':
      return <Switch {...props} onChange={e => handleChangeSetting(path, e.target.checked)} />;
    case 'string':
      return <TextInput {...props} onChange={e => handleChangeSetting(path, e.target.value)} />;
    case 'number':
      return <NumberInput {...props} onChange={e => handleChangeSetting(path, e.target.value)} />;
    // below doesnt really work
    case 'object':
    case 'array':
      return <JSONEditor editMode {...props} />;
    default:
      return <LargeBodyText>No input for this type: {type}</LargeBodyText>;
  }
};

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

const SettingName = ({ path, name, description }) => (
  <ThemedTooltip arrow placement="top" title={description}>
    <LargeBodyText ml={1} width="fit-content">
      {getName(name, path)}
    </LargeBodyText>
  </ThemedTooltip>
);

export const Category = ({ values, path = '', getCurrentSettingValue, handleChangeSetting }) => {
  const categoryTitle = values.name || capitalize(startCase(path));
  const WrapperComponent = path ? CategoryContainer : React.Fragment;
  const nestedLevel = path.split('.').length;
  return (
    <WrapperComponent {...(path && { $nestedLevel: nestedLevel })}>
      {categoryTitle && (
        <ThemedTooltip placement="top" arrow title={values.description}>
          <Heading4 width="fit-content" mt={0} mb={2}>
            {categoryTitle}
          </Heading4>
        </ThemedTooltip>
      )}
      <StyledList>
        {Object.entries(values.properties)
          .sort(([, value]) => (value.properties ? 1 : -1)) // Sort categories last
          .map(([key, value]) => {
            const newPath = path ? `${path}.${key}` : key;
            const { name, description, type, defaultValue } = value;
            const settingName = name || capitalize(startCase(key));
            if (type) {
              return (
                <SettingLine key={newPath}>
                  <ThemedTooltip arrow placement="top" title={description}>
                    <LargeBodyText width="fit-content">{settingName}</LargeBodyText>
                  </ThemedTooltip>
                  <SettingInput
                    type={type.type}
                    value={getCurrentSettingValue(newPath)}
                    placeholder={JSON.stringify(defaultValue, null, 2)}
                    path={newPath}
                    handleChangeSetting={handleChangeSetting}
                  />
                </SettingLine>
              );
            }
            return (
              <Category
                key={newPath}
                path={newPath}
                values={value}
                getCurrentSettingValue={getCurrentSettingValue}
                handleChangeSetting={handleChangeSetting}
              />
            );
          })}
      </StyledList>
    </WrapperComponent>
  );
};

export const EditorView = memo(({ values, setFieldValue, settings }) => {
  const { scope } = values;
  const [category, setCategory] = useState(null);

  const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
  const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
  const initialValues = useMemo(() => scopedSchema.properties[category], [category, scopedSchema]);

  const handleChangeScope = () => {
    setCategory(null);
  };
  const handleChangeCategory = e => setCategory(e.target.value);
  const handleChangeSetting = (path, value) => {
    const updatedSettings = set(settings, `${category}.${path}`, value);
    setFieldValue('settings', updatedSettings);
  };
  const getCurrentSettingValue = path => {
    return get(settings, `${category}.${path}`);
  };

  console.log(settings);

  return (
    <>
      <StyledTopBar>
        <ScopeSelectorFields onChangeScope={handleChangeScope} />
      </StyledTopBar>
      <SettingsContainer>
        <Box p={2}>
          <StyledSelectInput
            required
            label={<TranslatedText stringId="admin.settings.category" fallback="Category" />}
            value={category}
            onChange={handleChangeCategory}
            options={categoryOptions}
          />
        </Box>
        <Divider />
        <CategoriesContainer p={2}>
          {category && (
            <Category
              values={initialValues}
              getCurrentSettingValue={getCurrentSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          )}
        </CategoriesContainer>
      </SettingsContainer>
    </>
  );
});
