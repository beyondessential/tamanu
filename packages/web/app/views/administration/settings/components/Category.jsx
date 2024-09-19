import React, { memo } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';

import { isSetting } from '@tamanu/settings';

import { Heading4, BodyText, LargeBodyText } from '../../../../components';
import { Colors } from '../../../../constants';
import { ThemedTooltip } from '../../../../components/Tooltip';
import { SettingInput } from './SettingInput';
import { useAuth } from '../../../../contexts/Auth';
import { formatSettingName } from '../EditorView';

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
  align-items: flex-start;
  margin-bottom: 10px;
  width: 650px;
`;

const SettingNameText = styled(LargeBodyText)`
  margin-right: auto;
  margin-left: 5px;
  margin-top: 14px;
  width: fit-content;
  display: flex;
  align-items: center;
`;

const CategoryTitle = memo(({ name, path, description }) => {
  const categoryTitle = formatSettingName(name, path.split('.').pop());
  if (!categoryTitle) return null;
  return (
    <ThemedTooltip disableHoverListener={!description} arrow placement="top" title={description}>
      <Heading4 width="fit-content" mt={0} mb={2}>
        {categoryTitle}
      </Heading4>
    </ThemedTooltip>
  );
});

const SettingName = memo(({ name, path, description, disabled }) => (
  <ThemedTooltip disableHoverListener={!description} arrow placement="top" title={description}>
    <SettingNameText color={disabled && 'textTertiary'}>
      {formatSettingName(name, path.split('.').pop())}
      {disabled && <StyledLockIcon />}
    </SettingNameText>
  </ThemedTooltip>
));

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

          const isHighRisk = schema.highRisk || highRisk;
          const disabled = !canWriteHighRisk && isHighRisk;

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
              // Pass down highRisk from parent category to now top level subcategory
              schema={{ ...propertySchema, highRisk: isHighRisk }}
              getSettingValue={getSettingValue}
              handleChangeSetting={handleChangeSetting}
            />
          );
        })}
      </>
    </Wrapper>
  );
};
