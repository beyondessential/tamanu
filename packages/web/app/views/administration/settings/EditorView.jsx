import React, { memo, useMemo, useState } from 'react';
import { capitalize, startCase } from 'lodash';

import { getScopedSchema } from '@tamanu/settings';

import {
  BodyText,
  Heading4,
  SelectInput,
  TranslatedText,
  TextInput,
  Container,
  CheckInput,
} from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { JSONEditor } from './JSONEditor';

const StyledTopBar = styled.div`
  padding: 0;
`;

const StyledSelectInput = styled(SelectInput)`
  width: 300px;
`;

const SettingList = styled(Container)`
  width: 50%;
  align-items: center;
`;

const SettingItem = styled(BodyText)`
  display: flex;
`;

const SettingName = styled(BodyText)`
  display: flex;
  align-items: center;
  margin-right: 15px;
`;

const ComponentForType = {
  boolean: CheckInput,
  string: TextInput,
  object: JSONEditor // Doesnt work
}

export const Category = ({ values, path = '' }) => {
  return (
    <>
      <Heading4>{values.title || capitalize(startCase(path))}</Heading4>
      {Object.entries(values.properties).map(([key, value]) => {
        const { name, type, defaultValue } = value;
        if (type) {
          const SettingInput = ComponentForType[type.type]
          return (
            <SettingItem mt={2} key={Math.random()}>
              <SettingName>{name}</SettingName>
              <SettingInput placeholder={JSON.stringify(defaultValue)} />
            </SettingItem>
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
        <Box pt={2}>
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
      <SettingList pt={2}>
        {category && <Category values={scopedSchema.properties[category]} />}
      </SettingList>
    </>
  );
});
