import React, { memo, useMemo, useState } from 'react';
import { capitalize, pickBy, startCase } from 'lodash';

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

export const Category = ({ values, path = '' }) => {
  const title = values.title || capitalize(startCase(path));
  return (
    <>
      {title && (
        <ThemedTooltip placement="top" arrow title={values.description}>
          <Heading4 width="fit-content" mt={0} mb={2}>
            {title}
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
  const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);

  const initialValues = useMemo(() => getInitialValues(scopedSchema, category), [
    category,
    scopedSchema,
  ]);

  const handleChangeScope = () => setFieldValue('facilityId', null);
  const handleChangeCategory = e => setCategory(e.target.value);

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
        <Box p={2} pl={3}>
          {category && <Category values={initialValues} />}
        </Box>
      </CategoriesContainer>
    </>
  );
});
