import React, { memo, useMemo, useState } from 'react';
import { capitalize, omitBy, pickBy, startCase } from 'lodash';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';

import { getScopedSchema, isSetting } from '@tamanu/settings';

import { LargeBodyText, Heading4, SelectInput, TranslatedText } from '../../../components';
import { ScopeSelectorFields } from './ScopeSelectorFields';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';

const INDENT_NESTED_CATEGORY_BY = 20;

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
  margin-left: ${({ $levelNested }) => $levelNested * INDENT_NESTED_CATEGORY_BY}px;
  :not(:first-child) {
    padding-top: 20px;
    border-top: 1px solid ${Colors.outline};
  }
`;

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
    <LargeBodyText ml={1} width="fit-content">
      {getName(name, path)}
    </LargeBodyText>
  </ThemedTooltip>
);

export const Category = ({ values, path = '' }) => {
  const WrapperComponent = path ? CategoryContainer : Box;
  const levelNested = path.split('.').length;
  const sortedProperties = Object.entries(values.properties).sort(sortProperties);
  return (
    <WrapperComponent $levelNested={levelNested}>
      <CategoryTitle name={values.name} path={path} description={values.description} />
      <StyledList>
        {sortedProperties.map(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          return value.type ? (
            <SettingName
              key={newPath}
              path={newPath}
              name={value.name}
              description={value.description}
            />
          ) : (
            <Category key={newPath} path={newPath} values={value} />
          );
        })}
      </StyledList>
    </WrapperComponent>
  );
};

export const EditorView = memo(({ values }) => {
  const [category, setCategory] = useState(null);
  const { scope } = values;

  const scopedSchema = useMemo(() => prepareSchema(scope), [scope]);
  const categoryOptions = useMemo(() => getCategoryOptions(scopedSchema), [scopedSchema]);
  const initialValues = useMemo(() => scopedSchema.properties[category], [category, scopedSchema]);

  const handleChangeScope = () => {
    setCategory(null);
  };
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
