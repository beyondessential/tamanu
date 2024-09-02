import React, { memo, useMemo, useState } from 'react';
import { capitalize, pickBy, startCase } from 'lodash';

import { getScopedSchema } from '@tamanu/settings';

import { LargeBodyText, Heading4, SelectInput, TranslatedText } from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import styled from 'styled-components';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { Box, Divider } from '@material-ui/core';

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

const StyledList = styled.div`
  & :not(:last-child) {
    margin-bottom: 20px;
  }
`;

const CategoriesContainer = styled.div`
  padding: 20px;
`;

const CategoryContainer = styled.div`
  margin-left: ${({ $nestedLevel }) => $nestedLevel * 20}px;
  margin-right: ${({ $nestedLevel }) => $nestedLevel * 20}px;
  :not(:first-child) {
    padding-top: 20px;
    border-top: 1px solid ${Colors.outline};
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
  const categoryTitle = values.name || capitalize(startCase(path));
  const WrapperComponent = path ? CategoryContainer : styled.div``;
  const nestedLevel = path.split('.').length;
  return (
    <WrapperComponent $nestedLevel={nestedLevel}>
      {categoryTitle && (
        <ThemedTooltip placement="top" arrow title={values.description}>
          <Heading4 width="fit-content" mt={0} mb={2}>
            {categoryTitle}
          </Heading4>
        </ThemedTooltip>
      )}
      <StyledList>
        {Object.entries(values.properties)
          .sort(([, value]) => (value.properties ? 1 : -1))
          .map(([key, value]) => {
            const newPath = path ? `${path}.${key}` : key;
            const settingName = value.name || capitalize(startCase(key));
            if (value.type) {
              return (
                <ThemedTooltip arrow placement="top" title={value.description} key={newPath}>
                  <LargeBodyText ml={1} width="fit-content">
                    {settingName}
                  </LargeBodyText>
                </ThemedTooltip>
              );
            }
            return <Category key={newPath} path={newPath} values={value} />;
          })}
      </StyledList>
    </WrapperComponent>
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
          {category && <Category values={initialValues} />}
        </CategoriesContainer>
      </SettingsContainer>
    </>
  );
});
