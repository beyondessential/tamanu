import React, { memo } from 'react';
import styled from 'styled-components';
import LockIcon from '@material-ui/icons/Lock';

import { isSetting } from '@tamanu/settings';

import { BodyText, Heading4, LargeBodyText, TranslatedText } from '../../../../components';
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
  row-gap: 0.5rem;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;

  &:not(:first-child) {
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
  margin-block: 13px;
  padding-block: 0;
  font-size: 15px;
  inline-size: fit-content;
`;

const StyledHeading = styled(Heading4)`
  grid-column: 1 / -1;
  margin-block: 1rem;
  inline-size: fit-content;
`;

const CategoryTitle = memo(({ name, path, description }) => {
  const categoryTitle = formatSettingName(name, path.split('.').pop());
  if (!categoryTitle) return null;
  return (
    <ThemedTooltip
      disableHoverListener={!description}
      title={description}
      data-testid="themedtooltip-j5ux"
    >
      <StyledHeading data-testid="styledheading-js44">{categoryTitle}</StyledHeading>
    </ThemedTooltip>
  );
});

const SettingName = memo(({ name, path, description, disabled }) => (
  <ThemedTooltip
    disableHoverListener={!description && !disabled}
    title={
      disabled ? (
        <TranslatedText
          stringId="admin.settings.highRiskSettingTooltip"
          fallback="User does not required permissions to update this setting"
          data-testid="translatedtext-2xq4"
        />
      ) : (
        description
      )
    }
    data-testid="themedtooltip-2qoa"
  >
    <SettingNameLabel color={disabled && 'textTertiary'} data-testid="settingnamelabel-xr19">
      {formatSettingName(name, path.split('.').pop())}
      {disabled && <StyledLockIcon data-testid="styledlockicon-x3w0" />}
    </SettingNameLabel>
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
  const sortedProperties = Object.entries(schema.properties).sort(sortProperties);

  return (
    <Wrapper data-testid="wrapper-sc1t">
      <CategoryTitle
        name={schema.name}
        path={path}
        description={schema.description}
        data-testid="categorytitle-0pic"
      />
      {sortedProperties.map(([key, propertySchema]) => {
        const newPath = path ? `${path}.${key}` : key;
        const testIdSuffix = newPath.replace(/\./g, '-');
        const {
          name,
          description,
          type,
          defaultValue,
          unit,
          highRisk,
          suggesterEndpoint,
        } = propertySchema;

        const isHighRisk = schema.highRisk || highRisk;
        const disabled = !canWriteHighRisk && isHighRisk;

        return type ? (
          <SettingLine key={newPath} data-testid={`settingline-55rw-${testIdSuffix}`}>
            <SettingName
              disabled={disabled}
              path={newPath}
              name={name}
              description={description}
              data-testid={`settingname-g0r7-${testIdSuffix}`}
            />
            <SettingInput
              typeSchema={type}
              suggesterEndpoint={suggesterEndpoint}
              value={getSettingValue(newPath)}
              defaultValue={defaultValue}
              path={newPath}
              handleChangeSetting={handleChangeSetting}
              unit={unit}
              disabled={disabled}
              data-testid={`settinginput-2wuw-${testIdSuffix}`}
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
            data-testid={`category-9y74-${testIdSuffix}`}
          />
        );
      })}
    </Wrapper>
  );
};
