import React, { memo, useMemo, useState } from 'react';
import { capitalize, omitBy, pickBy, startCase, set, get } from 'lodash';
import styled from 'styled-components';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import {
  Heading4,
  SelectInput,
  TranslatedText,
  LargeBodyText,
  TextInput,
  NumberInput,
  TextButton,
  Button,
  OutlinedButton
} from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { JSONEditor } from './JSONEditor';
import { Box, Divider, Switch } from '@material-ui/core';

const SettingsContainer = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  margin-top: 20px;
`;

const StyledTopBar = styled.div`
  padding: 0;
  display: flex;
`;

const StyledSelectInput = styled(SelectInput)`
  width: 300px;
`;

const SettingLine = styled(LargeBodyText)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  &:not(:last-child) {
    margin-bottom: 10px;
  }
`;

const SettingButtons = styled.div`
  display: flex;
`;

const CategoryOptions = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubmitButton = styled(Button)`
  margin-left: 15px;
`

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

const INDENT_NESTED_CATEGORY_BY = 20;

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
  let InputComponent = null;
  let eventAccessor = null;
  switch (type) {
    case 'boolean':
      InputComponent = Switch;
      eventAccessor = e => e.target.checked;
      break;
    case 'string':
      InputComponent = TextInput;
      eventAccessor = e => e.target.value;
      break;
    case 'number':
      InputComponent = NumberInput;
      eventAccessor = e => Number(e.target.value);
      break;
    // below doesnt really work
    case 'object':
    case 'array':
      InputComponent = JSONEditor;
      eventAccessor = e => e;
      break;
    default:
      break;
  }
  return (
    <InputComponent
      editMode
      {...props}
      onChange={e => handleChangeSetting(path, eventAccessor(e))}
    />
  );
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
    <LargeBodyText ml={1} mr={5} width="fit-content">
      {getName(name, path)}
    </LargeBodyText>
  </ThemedTooltip>
);

export const Category = ({ values, path = '', getSettingValue, handleChangeSetting }) => {
  const WrapperComponent = path ? CategoryContainer : React.Fragment;
  const levelNested = path.split('.').length;
  const sortedProperties = Object.entries(values.properties).sort(sortProperties);
  return (
    <WrapperComponent {...(path && { $levelNested: levelNested })}>
      <CategoryTitle name={values.name} path={path} description={values.description} />
      <div>
        {sortedProperties.map(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          const { name, description, type, defaultValue } = value;
          return type ? (
            <SettingLine key={newPath}>
              <SettingName path={newPath} name={name} description={description} />
              <SettingButtons>
                <SettingInput
                  type={type.type}
                  value={getSettingValue(newPath)}
                  checked={getSettingValue(newPath)}
                  placeholder={JSON.stringify(defaultValue, null, 2)}
                  path={newPath}
                  handleChangeSetting={handleChangeSetting}
                />
                <TextButton onClick={() => handleChangeSetting(newPath, defaultValue)}>
                  Return to default
                </TextButton>
              </SettingButtons>
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
    </WrapperComponent>
  );
};

export const EditorView = memo(({ values, setValues, submitForm, settings }) => {
  const { scope } = values;
  const [category, setCategory] = useState(null);

  const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
  const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
  const initialValues = useMemo(() => scopedSchema.properties[category], [category, scopedSchema]);

  const handleChangeScope = () => setCategory(null);
  const handleChangeCategory = e => setCategory(e.target.value);

  const handleChangeSetting = (path, value) => {
    const updatedSettings = set(settings, `${category}.${path}`, value);
    setValues({ ...values, settings: updatedSettings });
  };
  const getSettingValue = path => get(settings, `${category}.${path}`);

  // TODO: reverse whole category

  return (
    <>
      <StyledTopBar>
        <ScopeSelectorFields onChangeScope={handleChangeScope} />
      </StyledTopBar>
      <SettingsContainer>
        <CategoryOptions p={2}>
          <StyledSelectInput
            required
            label={<TranslatedText stringId="admin.settings.category" fallback="Category" />}
            value={category}
            onChange={handleChangeCategory}
            options={categoryOptions}
          />
          <div>
            <OutlinedButton disabled={!values.settings}>
              Clear changes
            </OutlinedButton>
            <SubmitButton onClick={submitForm} disabled={!values.settings}>
              Save changes
            </SubmitButton>
          </div>
        </CategoryOptions>
        <Divider />
        <CategoriesContainer p={2}>
          {category && (
            <Category
              values={initialValues}
              getSettingValue={getSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          )}
        </CategoriesContainer>
      </SettingsContainer>
    </>
  );
});
