import React, { memo, useMemo, useState } from 'react';
import _, { capitalize, startCase } from 'lodash';

import { getScopedSchema } from '@tamanu/settings';

import { LargeBodyText, Heading4, SelectInput, TranslatedText } from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { Box, Divider } from '@material-ui/core';

const CategoriesContainer = styled.div`
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

const StyledList = styled.div`
  & :not(:last-child) {
    margin-bottom: 10px;
  }
`;

export const Category = ({ values, path = '' }) => {
  const title = values.title || capitalize(startCase(path));
  console.log(title);
  return (
    <>
      {title && (
        <ThemedTooltip placement="top" arrow title={values.description}>
          <Heading4 width="fit-content" mt={0} mb={2}>
            {values.title || capitalize(startCase(path))}
          </Heading4>
        </ThemedTooltip>
      )}
      <StyledList>
        {Object.entries(values.properties).map(([key, value]) => {
          if (value.type) {
            return (
              <ThemedTooltip arrow placement="top" title={value.description} key={Math.random()}>
                <LargeBodyText width="fit-content">{value.name}</LargeBodyText>
              </ThemedTooltip>
            );
          }
          return (
            <Category key={Math.random()} path={!path ? key : `${path}.${key}`} values={value} />
          );
        })}
      </StyledList>
    </>
  );
};

export const EditorView = memo(({ values, setFieldValue }) => {
  const { scope } = values;
  const [category, setCategory] = useState(null);
  const scopedSchema = useMemo(() => getScopedSchema(scope), [scope]);

  const onChangeScope = () => {
    setFieldValue('facilityId', null);
  };
  const options = Object.entries(_.pickBy(scopedSchema.properties, value => value.properties)).map(
    ([key, value]) => ({
      value: key,
      label: value.title || capitalize(startCase(key)),
    }),
  );
  const categoryOptions = [
    ...(options.length !== Object.keys(scopedSchema.properties).length
      ? [{ label: 'General', value: 'general' }]
      : []),
    ...options,
  ];

  console.log(_.pickBy(scopedSchema.properties, value => value.type));
  return (
    <>
      <StyledTopBar>
        <ScopeSelectorFields onChangeScope={onChangeScope} />
      </StyledTopBar>
      <CategoriesContainer>
        <Box p={2}>
          <StyledSelectInput
            label={<TranslatedText stringId="admin.settings.category" fallback="Category" />}
            value={category}
            onChange={e => setCategory(e.target.value)}
            options={categoryOptions}
          />
        </Box>
        <Divider />
        <Box p={2} pl={3}>
          {category && (
            <Category
              values={
                category === 'general'
                  ? {
                      ...scopedSchema,
                      properties: _.pickBy(scopedSchema.properties, value => value.type),
                    }
                  : scopedSchema.properties[category]
              }
            />
          )}
        </Box>
      </CategoriesContainer>
    </>
  );
});
