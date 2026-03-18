import React, { memo } from 'react';
import styled from 'styled-components';
import LockIcon from '@material-ui/icons/Lock';
import RefreshIcon from '@material-ui/icons/Refresh';
import { Alert } from '@material-ui/lab';

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

const StyledRestartIcon = styled(RefreshIcon)`
  font-size: 1.125rem;
  margin-inline-start: 0.25rem;
  color: ${Colors.orange};
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

const InfoBannerAlert = styled(Alert)`
  grid-column: 1 / -1;
  margin-block-end: 0.5rem;
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

const SettingName = memo(({ name, path, description, disabled, requiresRestart }) => (
  <SettingNameLabel color={disabled && 'textTertiary'} data-testid="settingnamelabel-xr19">
    <ThemedTooltip
      disableHoverListener={!description && !disabled}
      title={
        disabled ? (
          <TranslatedText
            stringId="admin.settings.highRiskSettingTooltip"
            fallback="User does not have required permissions to update this setting"
            data-testid="translatedtext-2xq4"
          />
        ) : (
          description
        )
      }
      data-testid="themedtooltip-2qoa"
    >
      <span>
        {formatSettingName(name, path.split('.').pop())}
        {disabled && <StyledLockIcon data-testid="styledlockicon-x3w0" />}
      </span>
    </ThemedTooltip>
    {requiresRestart && (
      <ThemedTooltip
        title={
          <TranslatedText
            stringId="admin.settings.requiresRestartTooltip"
            fallback="Requires server restart to take effect"
            data-testid="translatedtext-rr01"
          />
        }
        data-testid="themedtooltip-rr01"
      >
        <StyledRestartIcon data-testid="styledrestarticon-rr01" />
      </ThemedTooltip>
    )}
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

export const Category = ({
  schema,
  path = '',
  getSettingValue,
  getGlobalSettingValue,
  handleChangeSetting,
  facilityId,
}) => {
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
      {schema.infoBanner && (
        <InfoBannerAlert severity="info" data-testid="infobanneralert-fw01">
          {schema.infoBanner}
        </InfoBannerAlert>
      )}
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
          requiresRestart,
          suggesterEndpoint,
        } = propertySchema;

        const isHighRisk = schema.highRisk || highRisk;
        const needsRestart = schema.requiresRestart || requiresRestart;
        const disabled = !canWriteHighRisk && isHighRisk;

        return type ? (
          <SettingLine key={newPath} data-testid={`settingline-55rw-${testIdSuffix}`}>
            <SettingName
              disabled={disabled}
              requiresRestart={needsRestart}
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
              globalValue={getGlobalSettingValue?.(newPath)}
              path={newPath}
              handleChangeSetting={handleChangeSetting}
              unit={unit}
              disabled={disabled}
              facilityId={facilityId}
              data-testid={`settinginput-2wuw-${testIdSuffix}`}
            />
          </SettingLine>
        ) : (
          <Category
            key={newPath}
            path={newPath}
            schema={{
              ...propertySchema,
              // Pass down inherited properties to the child category
              highRisk: isHighRisk,
              requiresRestart: needsRestart,
            }}
            getSettingValue={getSettingValue}
            getGlobalSettingValue={getGlobalSettingValue}
            handleChangeSetting={handleChangeSetting}
            facilityId={facilityId}
            data-testid={`category-9y74-${testIdSuffix}`}
          />
        );
      })}
    </Wrapper>
  );
};
