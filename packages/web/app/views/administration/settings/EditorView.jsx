import React, { memo, useMemo, useState } from 'react';
import { capitalize, startCase, set, get } from 'lodash';

import { getScopedSchema } from '@tamanu/settings';

import {
  Heading4,
  SelectInput,
  TranslatedText,
  BodyText,
  CheckInput,
  TextInput,
  NumberInput,
} from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { JSONEditor } from './JSONEditor';

const CategoriesContainer = styled.div`
  padding: 20px;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  width: 500px;
`;

const StyledTopBar = styled.div`
  padding: 0;
`;

const StyledSelectInput = styled(SelectInput)`
  width: 300px;
`;

const SettingLine = styled(BodyText)`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const SettingName = styled(BodyText)`
  display: flex;
  align-items: center;
  margin-right: 15px;
`;

const ComponentForType = {
  boolean: CheckInput,
  string: TextInput,
  number: NumberInput,
  object: JSONEditor, // Doesnt work
  array: JSONEditor, // Doesnt work
};

export const Category = ({ values, path = '', onChangeSettings }) => {
  const title = values.title || capitalize(startCase(path));
  console.log(values.settings)
  return (
    <>
      {title && (
        <ThemedTooltip placement="top" arrow title={values.description}>
          <Heading4 width="fit-content" mt={0} mb={1}>
            {values.title || capitalize(startCase(path))}
          </Heading4>
        </ThemedTooltip>
      )}
      {Object.entries(values.properties).map(([key, value]) => {
        const { name, description, type, defaultValue } = value;
        if (type) {
          const SettingInput = ComponentForType[type.type];
          const isJsonEditor = type.type === 'object';
          return (
            <SettingLine key={Math.random()} width="fit-content">
              <ThemedTooltip arrow placement="top" title={description}>
                <SettingName>{name}</SettingName>
              </ThemedTooltip>
              <SettingInput
                onChange={e => onChangeSettings(`${path}.${key}`, e.target.value)}
                placeholder={isJsonEditor ? JSON.stringify(defaultValue) : defaultValue}
              />
            </SettingLine>
          );
        }
        return (
          <Category
            onChangeSettings={onChangeSettings}
            key={Math.random()}
            path={!path ? key : `${path}.${key}`}
            values={value}
          />
        );
      })}
    </>
  );
};

export const EditorView = memo(({ values, setFieldValue, settings }) => {
  const { scope } = values;
  const [category, setCategory] = useState(null);
  const [settingsEditObject, setSettingsEditObject] = useState(settings);
  const scopedSchema = useMemo(() => getScopedSchema(scope), [scope]);

  const onChangeScope = () => {
    setFieldValue('facilityId', null);
  };


  // TODO: not really working
  const onChangeSettings = (path, value) => {
    const updatedSettingsObject = set(values.settings || settings, path, JSON.parse(value));
    setSettingsEditObject(updatedSettingsObject);
    setFieldValue('settings', updatedSettingsObject);
  };


  return (
    <>
      <StyledTopBar>
        <ScopeSelectorFields scope={scope} onChangeScope={onChangeScope} />
        <Box pt={2} pb={2}>
          <StyledSelectInput
            label={<TranslatedText stringId="admin.settings.category" fallback="Category" />}
            value={category}
            onChange={e => setCategory(e.target.value)}
            options={Object.entries(scopedSchema.properties).map(([key, value]) => ({
              value: key,
              label: value.title || capitalize(startCase(key)),
            }))}
          />
        </Box>
      </StyledTopBar>
      {category && (
        <CategoriesContainer>
          <Category
            onChangeSettings={onChangeSettings}
            values={scopedSchema.properties[category]}
            path={category}
          />
        </CategoriesContainer>
      )}
    </>
  );
});
