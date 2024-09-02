import React, { memo, useMemo, useState } from 'react';
import { capitalize, omitBy, pickBy, startCase } from 'lodash';

import { getScopedSchema, isSetting } from '@tamanu/settings';

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

export const Category = ({ values, path = '' }) => {
  const categoryTitle = values.name || capitalize(startCase(path));
  const WrapperComponent = path ? CategoryContainer : React.Fragment;
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

  const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
  const categoryOptions = useMemo(
    () =>
      Object.entries(scopedSchema.properties).map(([key, value]) => ({
        value: key,
        label: value.name || capitalize(startCase(key)),
      })),
    [scopedSchema],
  );
  const initialValues = useMemo(() => scopedSchema.properties[category], [category, scopedSchema]);

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
