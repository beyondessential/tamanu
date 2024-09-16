import React from 'react';
import { Heading4, BodyText } from '../../../../components';
import { Colors } from '../../../../constants';
import { ThemedTooltip } from '../../../../components/Tooltip';
import { Box } from '@material-ui/core';
import { SettingInput } from './SettingInput';
import styled from 'styled-components';
import { capitalize, startCase } from 'lodash';

import { isSetting } from '@tamanu/settings';
import { useAuth } from '../../../../contexts/Auth';

const INDENT_WIDTH_PX = 20;

const CategoryWrapper = styled.div`
  // margin-left: ${({ $nestLevel }) => $nestLevel * INDENT_WIDTH_PX}px;
  :not(:first-child) {
    padding-top: 20px;
    border-top: 1px solid ${Colors.outline};
  }
`;

const SettingLine = styled(BodyText)`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
  width: 650px;
`;

const getName = (name, path) => name || capitalize(startCase(path.split('.').pop()));

const CategoryTitle = ({ name, path, description }) => {
  const categoryTitle = getName(name, path);
  if (!categoryTitle) return null;

  const titleText = (
    <Heading4 width="fit-content" mt={0} mb={2}>
      {categoryTitle}
    </Heading4>
  );

  return description ? (
    <ThemedTooltip arrow placement="top" title={description}>
      {titleText}
    </ThemedTooltip>
  ) : (
    titleText
  );
};

const SettingName = ({ name, path, description }) => {
  const nameText = (
    <BodyText ml={1} mt={1} mr="auto" width="fit-content">
      {getName(name, path)}
    </BodyText>
  );

  return description ? (
    <ThemedTooltip arrow placement="top" title={description}>
      {nameText}
    </ThemedTooltip>
  ) : (
    nameText
  );
};

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

export const Category = ({ schema, path = '', getSettingValue, handleChangeSetting }) => {
  const { ability } = useAuth();
  // Is system admin
  const canWriteHighRisk = ability.can('manage', 'all');
  if (!schema) return null;
  const Wrapper = path ? CategoryWrapper : Box;
  const sortedProperties = Object.entries(schema.properties).sort(sortProperties);

  return (
    <Wrapper>
      <CategoryTitle name={schema.name} path={path} description={schema.description} />
      <>
        {sortedProperties.map(([key, propertySchema]) => {
          const newPath = path ? `${path}.${key}` : key;
          const { name, description, type, defaultValue, unit, highRisk } = propertySchema;

          return type ? (
            <SettingLine key={newPath}>
              <SettingName path={newPath} name={name} description={description} />
              <SettingInput
                typeSchema={type}
                value={getSettingValue(newPath)}
                defaultValue={defaultValue}
                path={newPath}
                handleChangeSetting={handleChangeSetting}
                unit={unit}
                disabled={!canWriteHighRisk && (schema.highRisk || highRisk)}
              />
            </SettingLine>
          ) : (
            <Category
              key={newPath}
              path={newPath}
              schema={propertySchema}
              getSettingValue={getSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          );
        })}
      </>
    </Wrapper>
  );
};
