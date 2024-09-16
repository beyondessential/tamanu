import React from 'react';
import { Heading4, BodyText } from '../../../../components';
import { Colors } from '../../../../constants';
import { ThemedTooltip } from '../../../../components/Tooltip';
import LockIcon from '@material-ui/icons/Lock';
import { Box } from '@material-ui/core';
import { SettingInput } from './SettingInput';
import styled from 'styled-components';
import { capitalize, startCase } from 'lodash';

import { isSetting } from '@tamanu/settings';
import { useAuth } from '../../../../contexts/Auth';

const StyledLockIcon = styled(LockIcon)`
  font-size: 18px;
  margin-left: 5px;
`;

const CategoryWrapper = styled.div`
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

const SettingName = ({ name, path, description, disabled }) => {
  const nameText = (
    <BodyText
      color={disabled && 'textTertiary'}
      display="flex"
      alignItems="center"
      width="fit-content"
      mr="auto"
      ml={1}
      mt={1}
    >
      {getName(name, path)}
      {disabled && <StyledLockIcon />}
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

          const disabled = !canWriteHighRisk && (schema.highRisk || highRisk);

          return type ? (
            <SettingLine key={newPath}>
              <SettingName
                disabled={disabled}
                path={newPath}
                name={name}
                description={description}
              />
              <SettingInput
                typeSchema={type}
                value={getSettingValue(newPath)}
                defaultValue={defaultValue}
                path={newPath}
                handleChangeSetting={handleChangeSetting}
                unit={unit}
                disabled={disabled}
              />
            </SettingLine>
          ) : (
            <Category
              key={newPath}
              path={newPath}
              schema={
                // If the category is high risk, pass that down to the subcategory
                schema.highRisk ? { ...propertySchema, highRisk: schema.highRisk } : propertySchema
              }
              getSettingValue={getSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          );
        })}
      </>
    </Wrapper>
  );
};
