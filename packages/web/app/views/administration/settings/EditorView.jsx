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
  OutlinedButton,
} from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { JSONEditor } from './JSONEditor';
import { Box, Divider, Switch } from '@material-ui/core';

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
  padding-right: 45%;
`;

const CategoryOptions = styled(Box)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubmitButton = styled(Button)`
  margin-left: 15px;
`;

const DefaultSettingButton = styled(TextButton)`
  margin-left: 15px;
  font-size: 14px;
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

const Unit = styled.div`
  display: flex;
  align-items: center;
  padding-left: 5px;
`

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

const DefaultButton = ({resetToDefault}) => {
  return <DefaultSettingButton onClick={resetToDefault}>Reset to default</DefaultSettingButton>;
};
const SettingInput = ({ type, path, value, defaultValue, handleChangeSetting, unit }) => {
  const [error, setError] = useState(null);

  switch (type) {
    case 'boolean':
      return (
        <Switch
          color="primary"
          checked={value}
          onChange={e => handleChangeSetting(path, e.target.checked)}
        />
      );
    case 'string':
      return (
        <>
          <TextInput
            value={value}
            placeholder={defaultValue}
            onChange={e => handleChangeSetting(path, e.target.value)}
            style={{ width: '353px' }}
          />
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
        </>
      );
    case 'number':
      return (
        <>
          <NumberInput
            value={value}
            placeholder={defaultValue}
            onChange={e => handleChangeSetting(path, Number(e.target.value))}
            style={{ width: '80px' }}
          />
          <Unit>{unit}</Unit>
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
        </>
      );
    case 'longText':
      return (
        <>
          <TextInput
            value={value}
            onChange={e => handleChangeSetting(path, e.target.value)}
            placeholder={defaultValue}
            style={{ width: '353px', minHeight: '156px' }}
            multiline
          />
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
        </>
      );

    // below doesnt really work
    case 'object':
    case 'array':
    case 'mixed':
      return (
        <>
          <JSONEditor
            height="156px"
            width="353px"
            editMode
            showGutter={false}
            // TODO: This breks on reload as value is not a string anymore
            value={value}
            defaultValue={JSON.stringify(defaultValue, null, 2)}
            onChange={e => {
              handleChangeSetting(path, e);
              try {
                JSON.parse(e);
                setError(null);
              } catch (err) {
                setError(err);
              }
            }}
            error={error}
          />
          {/* TODO: broken also */}
          <DefaultButton resetToDefault={() => handleChangeSetting(path, defaultValue)} />
        </>
      );
    default:
      return (
        <LargeBodyText>
          No component for this type: {type} (default: {defaultValue})
        </LargeBodyText>
      );
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

const SettingName = ({ name, path, description }) => (
  <ThemedTooltip arrow placement="top" title={description}>
    <LargeBodyText ml={1} mr="auto" width="fit-content">
      {getName(name, path)}
    </LargeBodyText>
  </ThemedTooltip>
);

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

export const EditorView = memo(({ values, setValues, submitForm, settings }) => {
  const { scope } = values;
  const [category, setCategory] = useState(null);

  const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
  const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
  const initialValues = useMemo(() => scopedSchema.properties[category], [category, scopedSchema]);

  const handleChangeScope = () => setCategory(null);
  // TODO: are you sure if they change category without saving settings
  const handleChangeCategory = e => setCategory(e.target.value);

  const handleChangeSetting = (path, value) => {
    const updatedSettings = set(settings, `${category}.${path}`, value);
    setValues({ ...values, settings: updatedSettings });
  };
  const getSettingValue = path => get(settings, `${category}.${path}`);

  // TODO: reverse whole category

  const saveSettings = async event => {
    const parsedObject = parseJsonStrings(settings);
    setValues({ ...values, settings: parsedObject });
    await submitForm(event);
  };

  return (
    <>
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
            <OutlinedButton disabled={!values.settings}>Clear changes</OutlinedButton>
            <SubmitButton onClick={saveSettings} disabled={!values.settings}>
              Save changes
            </SubmitButton>
          </div>
        </CategoryOptions>
        <Divider />
        <CategoriesWrapper p={2}>
          {category && (
            <Category
              values={initialValues}
              getSettingValue={getSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          )}
        </CategoriesWrapper>
      </SettingsWrapper>
    </>
  );
});
