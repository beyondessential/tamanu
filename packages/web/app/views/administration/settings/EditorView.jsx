import React, { memo, useMemo, useState } from 'react';
import { capitalize, pickBy, startCase, set, get } from 'lodash';

import { getScopedSchema } from '@tamanu/settings';

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
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { JSONEditor } from './JSONEditor';
import { Box, Divider } from '@material-ui/core';

const CategoriesContainer = styled.div`
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
    margin-bottom: 10px;
  }
`;

const SettingLine = styled(LargeBodyText)`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SettingInput = ({ type, ...props }) => {
  switch (type) {
    case 'boolean':
      return <CheckInput {...props} />;
    case 'string':
      return <TextInput {...props} />;
    case 'number':
      return <NumberInput {...props} />;
    // below doesnt really work
    case 'object':
    case 'array':
      return <JSONEditor editMode {...props} />;
    default:
      return <LargeBodyText>No input for this type: {type}</LargeBodyText>;
  }
};

const getCategoryOptions = schema => {
  const nestedProperties = pickBy(schema.properties, value => !value.type);
  const options = Object.entries(nestedProperties).map(([key, value]) => ({
    value: key,
    label: value.title || capitalize(startCase(key)),
  }));
  if (options.length !== Object.keys(schema.properties).length) {
    options.unshift({ label: 'General', value: 'general' });
  }
  return options;
};

const getInitialValues = (schema, category) => {
  if (category === 'general') {
    return {
      ...schema,
      properties: pickBy(schema.properties, value => value.type),
    };
  }
  return schema.properties[category];
};

export const Category = ({ values, path = '', getCurrentSettingValue, handleChangeSetting }) => {
  const categoryTitle = values.name || capitalize(startCase(path));
  return (
    <>
      {categoryTitle && (
        <ThemedTooltip placement="top" arrow title={values.description}>
          <Heading4 width="fit-content" mt={0} mb={2}>
            {categoryTitle}
          </Heading4>
        </ThemedTooltip>
      )}
      <StyledList>
        {Object.entries(values.properties).map(([key, value]) => {
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
                  onChange={e => handleChangeSetting(newPath, e.target.value)}
                  placeholder={JSON.stringify(defaultValue)}
                />
              </SettingLine>
            );
          }
          return (
            <Category
              key={Math.random()}
              path={newPath}
              values={value}
              getCurrentSettingValue={getCurrentSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          );
        })}
      </StyledList>
    </>
  );
};

export const EditorView = memo(({ values, setFieldValue, settings }) => {
  const { scope } = values;
  const [category, setCategory] = useState(null);

  const scopedSchema = useMemo(() => getScopedSchema(scope), [scope]);
  const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
  const initialValues = useMemo(() => getInitialValues(scopedSchema, category), [
    category,
    scopedSchema,
  ]);

  const handleChangeScope = () => setFieldValue('facilityId', null);
  const handleChangeCategory = e => setCategory(e.target.value);
  const handleChangeSetting = (path, value) => {
    const updatedSettings = set(settings, `${category}.${path}`, value);
    setFieldValue('settings', updatedSettings);
  };
  const getCurrentSettingValue = path => {
    return get(settings, `${category}.${path}`);
  };

  return (
    <>
      <StyledTopBar>
        <ScopeSelectorFields onChangeScope={handleChangeScope} />
      </StyledTopBar>
      <CategoriesContainer>
        <Box p={2}>
          <StyledSelectInput
            label={<TranslatedText stringId="admin.settings.category" fallback="Category" />}
            value={category}
            onChange={handleChangeCategory}
            options={categoryOptions}
          />
        </Box>
        <Divider />
        {category && (
          <Box p={2} pl={3}>
            <Category
              values={initialValues}
              getCurrentSettingValue={getCurrentSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          </Box>
        )}
      </CategoriesContainer>
    </>
  );
});
