import React, { memo } from 'react';
import styled from 'styled-components';
import LockIcon from '@material-ui/icons/Lock';

import { isSetting } from '@tamanu/settings';

import { BodyText, Heading4, LargeBodyText } from '../../../../components';
import { Colors } from '../../../../constants';
import { ThemedTooltip } from '../../../../components/Tooltip';
import { SettingInput } from './SettingInput';
import { useAuth } from '../../../../contexts/Auth';
import { formatSettingName } from '../EditorView';

const StyledLockIcon = styled(LockIcon)`
  font-size: 1.125rem;
  margin-inline-start: 0.25rem;
`;

const Wrapper = styled.div`
  display: grid;
  gap: 1rem;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;

  :not(:first-child) {
    border-top: 1px solid ${Colors.outline};
  }
`;

const SettingLine = styled(BodyText)`
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
`;

const SettingNameLabel = styled(LargeBodyText)`
  // Match TextField for baseline alignment
  // Cannot use ‘align-items: baseline’ on parent flexbox because InputText has incorrect semantics
  padding-block: 13px;
  font-size: 15px;
`;

const Tooltip = styled(ThemedTooltip).attrs({ as: 'span', arrow: true, placement: 'top' })``;

const CategoryTitle = memo(({ name, path, description }) => {
  const categoryTitle = formatSettingName(name, path.split('.').pop());
  if (!categoryTitle) return null;
  return (
    <Heading4>
      <Tooltip disableHoverListener={!description} title={description}>
        {categoryTitle}
      </Tooltip>
    </Heading4>
  );
});

const SettingName = memo(({ name, path, description, disabled }) => (
  <SettingNameLabel color={disabled && 'textTertiary'}>
    <Tooltip disableHoverListener={!description} title={description}>
      {formatSettingName(name, path.split('.').pop())}
      {disabled && <StyledLockIcon />}
    </Tooltip>
  </SettingNameLabel>
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
  const sortedProperties = Object.entries(schema.properties).sort(sortProperties);

  return (
    <Wrapper>
      <CategoryTitle name={schema.name} path={path} description={schema.description} />
      {sortedProperties.map(([key, propertySchema]) => {
        const newPath = path ? `${path}.${key}` : key;
        const { name, description, type, defaultValue, unit, highRisk } = propertySchema;

        const isHighRisk = schema.highRisk || highRisk;
        const disabled = !canWriteHighRisk && isHighRisk;

        return type ? (
          <SettingLine key={newPath}>
            <SettingName disabled={disabled} path={newPath} name={name} description={description} />
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
    </Wrapper>
  );
};
