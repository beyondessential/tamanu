import React, { memo, useMemo, useState } from 'react';
import { capitalize, startCase } from 'lodash';

import { getScopedSchema } from '@tamanu/settings';

import { BodyText, Heading4, SelectInput, TranslatedText } from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Colors } from '../../../constants';

const CategoriesContainer = styled.div`
  padding: 20px;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
`;

const StyledTopBar = styled.div`
  padding: 0;
`;

const StyledSelectInput = styled(SelectInput)`
  width: 300px;
`;

export const Category = ({ values, path = '' }) => {
  const title = values.title || capitalize(startCase(path));
  return (
    <>
      {title && <Heading4 mt={0}>{values.title || capitalize(startCase(path))}</Heading4>}
      {Object.entries(values.properties).map(([key, value]) => {
        if (value.type) {
          return (
            <BodyText mt={2} key={Math.random()}>
              {value.name}
            </BodyText>
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
      <CategoriesContainer>
        {category && <Category values={scopedSchema.properties[category]} />}
      </CategoriesContainer>
    </>
  );
});
