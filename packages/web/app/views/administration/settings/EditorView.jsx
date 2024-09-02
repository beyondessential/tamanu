import React, { memo, useMemo, useState } from 'react';
import { capitalize, startCase } from 'lodash';

import { getScopedSchema } from '@tamanu/settings';

import {
  Heading4,
  SelectInput,
  TranslatedText,
  BodyText,
  CheckInput,
  TextInput,
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
  width: 40%;
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
  object: JSONEditor, // Doesnt work
  array: JSONEditor
};

export const Category = ({ values, path = '' }) => {
  const title = values.title || capitalize(startCase(path));
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
        const { name, type, defaultValue } = value;
        if (type) {
          const SettingInput = ComponentForType[type.type];
          return (
            <ThemedTooltip arrow placement="top" title={value.description} key={Math.random()}>
              <SettingLine width="fit-content">
                <SettingName>{name}</SettingName>
                <SettingInput placeholder={JSON.stringify(defaultValue)} />
              </SettingLine>
            </ThemedTooltip>
          );
        }
        return (
          <Category key={Math.random()} path={!path ? key : `${path}.${key}`} values={value} />
        );
      })}
    </>
  );
};

export const EditorView = memo(({ values, setFieldValue, settings }) => {
  const { scope } = values;
  const [category, setCategory] = useState(null);
  const scopedSchema = useMemo(() => getScopedSchema(scope), [scope]);

  const onChangeScope = () => {
    setFieldValue('facilityId', null);
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
          <Category values={scopedSchema.properties[category]} />
        </CategoriesContainer>
      )}
    </>
  );
});
