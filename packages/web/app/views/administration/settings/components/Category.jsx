import React, { memo } from 'react';
import styled from 'styled-components';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert } from '@material-ui/lab';
import KeyIcon from '@mui/icons-material/Key';
import WarningIcon from '@mui/icons-material/WarningAmber';
import { escapeRegExp } from 'es-toolkit/compat';

import { SETTING_EDITORS } from '@tamanu/constants';
import { isSetting } from '@tamanu/settings/schema';

import { BodyText, Heading4, LargeBodyText, TranslatedText } from '../../../../components';
import { Colors } from '../../../../constants';
import { ThemedTooltip } from '../../../../components/Tooltip';
import { SettingInput, ResetToDefaultButton } from './SettingInput';
import { useAuth } from '../../../../contexts/Auth';
import { formatSettingName } from '../formatSettingName';

const StyledLockIcon = styled(LockIcon)`
  flex-shrink: 0;
  font-size: 0.875rem;
  line-height: 1;
`;

const StyledSecretIcon = styled(KeyIcon)`
  flex-shrink: 0;
  font-size: 0.875rem;
  line-height: 1;
`;

const StyledRestartIcon = styled(RefreshIcon)`
  font-size: 1.125rem;
  margin-inline-start: 0.25rem;
  color: ${Colors.orange};
`;

const StyledHighRiskIcon = styled(WarningIcon)`
  font-size: 1.125rem;
  margin-inline-start: 0.25rem;
  color: ${Colors.orange};
`;

const Wrapper = styled.div`
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  // no row-gap: rows stack contiguously so the zebra/hover bands are an
  // unbroken stripe; the label/actions block margins (which sit inside the
  // band) give the vertical breathing room

  &:not(:first-child) {
    border-top: 1px solid ${Colors.outline};
  }
`;

const SettingLine = styled(BodyText)`
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  transition: background-color 100ms ease;

  // Subtle zebra shading so adjacent settings are easy to tell apart. nth-of-type
  // (not nth-child) keys off the element tag: the category heading is an <h4> and
  // settings sort before any nested sub-category groups (see sortProperties), so
  // the setting rows are the leading, contiguous <div> siblings and alternate
  // cleanly. Background only — no padding/margin — to leave subgrid alignment
  // untouched.
  &:nth-of-type(even) {
    background-color: ${Colors.background};
  }

  // Highlight on hover, and keep it while a control on the row is focused —
  // including when a <select> is open and the pointer has moved down into its
  // menu (react-select keeps focus on the control inside the row, so
  // :focus-within holds even if the menu portals out of this subtree).
  &:hover,
  &:focus-within {
    background-color: ${Colors.primary10};
  }
`;

// the row's third column: the reset-to-default action, centred against the
// row's input like the label is
const RowActions = styled.div`
  align-items: ${props => (props.$alignTop ? 'flex-start' : 'center')};
  align-self: stretch;
  display: flex;
  justify-content: flex-end;
  margin-block: 13px;
  // inset from the band's right edge (the container itself has no padding)
  padding-inline-end: 1.25rem;
`;

const SettingNameLabel = styled(LargeBodyText)`
  // Match TextField for baseline alignment
  // Cannot use 'align-items: baseline' on parent flexbox because InputText has incorrect semantics
  align-items: center;
  align-self: ${props => (props.$alignTop ? 'start' : 'center')};
  display: inline-flex;
  gap: 0.25rem;
  margin-block: 13px;
  padding-block: 0;
  // inset from the band's left edge, plus one step per nesting level
  margin-inline-start: ${props => 1.25 + (props.$indent ?? 0) * 1.25}rem;
  font-size: 15px;
  inline-size: fit-content;
`;

const StyledHeading = styled(Heading4)`
  grid-column: 1 / -1;
  margin-block: 1rem;
  // align with the row labels' left inset, plus one step per nesting level
  margin-inline-start: ${props => 1.25 + (props.$indent ?? 0) * 1.25}rem;
  inline-size: fit-content;
`;

const InfoBannerAlert = styled(Alert)`
  grid-column: 1 / -1;
  margin-block-end: 0.5rem;
  // align with the heading's inset at this nesting level
  margin-inline-start: ${props => 1.25 + (props.$indent ?? 0) * 1.25}rem;
  margin-inline-end: 1.25rem;
`;

// a step above the hover band (primary10) so highlights survive row hover
const Mark = styled.mark`
  background-color: ${Colors.primary30};
  border-radius: 2px;
  color: inherit;
`;

// description shown under the row when the search hit is in it
const MatchedDescription = styled(BodyText)`
  color: ${Colors.midText};
  font-size: 13px;
  grid-column: 1 / -1;
  margin-block: -8px 13px;
  // outer label's per-depth margin + inner label's base 1.25rem
  margin-inline-start: ${props => 2.5 + (props.$indent ?? 0) * 1.25}rem;
  max-inline-size: 60ch;
`;

// substring (not word-start) so it explains rows from either matching tier
const highlightMatches = (text, query) => {
  const needle = query?.trim();
  if (!needle) return text;
  const matcher = new RegExp(escapeRegExp(needle), 'gi');
  const parts = [];
  let last = 0;
  let match;
  while ((match = matcher.exec(text))) {
    parts.push(text.slice(last, match.index));
    parts.push(<Mark key={match.index}>{match[0]}</Mark>);
    last = match.index + match[0].length;
  }
  if (last === 0) return text;
  parts.push(text.slice(last));
  return parts;
};

const CategoryTitle = memo(({ name, path, description, depth, searchQuery }) => {
  const categoryTitle = formatSettingName(name, path.split('.').pop());
  if (!categoryTitle) return null;
  return (
    <ThemedTooltip
      disableHoverListener={!description}
      title={description}
      data-testid="themedtooltip-j5ux"
    >
      <StyledHeading $indent={depth} data-testid="styledheading-js44">
        {searchQuery ? highlightMatches(categoryTitle, searchQuery) : categoryTitle}
      </StyledHeading>
    </ThemedTooltip>
  );
});

const SettingName = memo(
  ({
    name,
    path,
    description,
    disabled,
    isSecret,
    requiresRestart,
    highRisk,
    depth,
    alignTop,
    searchQuery,
  }) => (
  <SettingNameLabel
    $indent={depth}
    $alignTop={alignTop}
    color={disabled && 'textTertiary'}
    data-testid="settingnamelabel-xr19"
  >
    <ThemedTooltip
      disableHoverListener={!description && !disabled && !isSecret}
      title={
        disabled ? (
          <TranslatedText
            stringId="admin.settings.highRiskSettingTooltip"
            fallback="User does not required permissions to update this setting"
            data-testid="translatedtext-2xq4"
          />
        ) : isSecret ? (
          <TranslatedText
            stringId="admin.settings.secretSettingTooltip"
            fallback="This is a secret setting. The current value is hidden."
            data-testid="translatedtext-secret"
          />
        ) : (
          description
        )
      }
      data-testid="themedtooltip-2qoa"
    >
      <SettingNameLabel color={disabled && 'textTertiary'} data-testid="settingnamelabel-xr19">
        {/* one span: the label is inline-flex with a gap, so bare fragments would gap apart */}
        <span>
          {searchQuery
            ? highlightMatches(formatSettingName(name, path.split('.').pop()), searchQuery)
            : formatSettingName(name, path.split('.').pop())}
        </span>
        {disabled ? (
          <StyledLockIcon data-testid="styledlockicon-x3w0" />
        ) : (
          isSecret && <StyledSecretIcon data-testid="styledsecreticon-z8xp" />
        )}
      </SettingNameLabel>
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
    {highRisk && !disabled && (
      <ThemedTooltip
        title={
          <TranslatedText
            stringId="admin.settings.highRiskWarningTooltip"
            fallback="High-risk setting — changes can have significant effects"
            data-testid="translatedtext-hr01"
          />
        }
        data-testid="themedtooltip-hr01"
      >
        <StyledHighRiskIcon data-testid="styledhighriskicon-hr01" />
      </ThemedTooltip>
    )}
  </SettingNameLabel>
));

// search ordering from the filter's metadata (absent outside search):
// exact hits first, then match tier
const sortProperties = searchMeta => ([a0, a1], [b0, b1]) => {
  const aMeta = searchMeta?.get(a1);
  const bMeta = searchMeta?.get(b1);
  const aExact = Boolean(aMeta?.exact || aMeta?.hasExact);
  const bExact = Boolean(bMeta?.exact || bMeta?.hasExact);
  if (aExact !== bExact) return aExact ? -1 : 1;
  const aTier = aMeta?.tier ?? Infinity;
  const bTier = bMeta?.tier ?? Infinity;
  if (aTier !== bTier) return aTier - bTier;
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
  depth = 0,
  getSettingValue,
  getGlobalSettingValue,
  resolveSettingsPath,
  handleChangeSetting,
  facilityId,
  searchQuery,
  searchMeta,
}) => {
  const { ability } = useAuth();
  const canWriteHighRisk = ability.can('manage', 'all');
  if (!schema) return null;
  const sortedProperties = Object.entries(schema.properties).sort(sortProperties(searchMeta));

  return (
    <Wrapper data-testid="wrapper-sc1t">
      <CategoryTitle
        name={schema.name}
        path={path}
        depth={depth}
        description={schema.description}
        searchQuery={searchQuery}
        data-testid="categorytitle-0pic"
      />
      {schema.infoBanner && (
        <InfoBannerAlert severity="info" $indent={depth} data-testid="infobanneralert-fw01">
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
          secret,
          editor,
          options,
        } = propertySchema;

        const needsRestart = schema.requiresRestart || requiresRestart;
        const isSecret = Boolean(secret);
        const isHighRisk = schema.highRisk || highRisk || isSecret;
        const disabled = !canWriteHighRisk && isHighRisk;
        const isMultiEntry =
          editor === SETTING_EDITORS.MAPPING || editor === SETTING_EDITORS.OBJECT_LIST;
        const showMatchedDescription =
          Boolean(searchQuery) && Boolean(searchMeta?.get(propertySchema)?.matchedDescription);

        if (!type) {
          return (
            <Category
              key={newPath}
              path={newPath}
              depth={depth + 1}
              // Pass down inherited properties to the child category
              schema={{ ...propertySchema, highRisk: isHighRisk, requiresRestart: needsRestart }}
              getSettingValue={getSettingValue}
              getGlobalSettingValue={getGlobalSettingValue}
              resolveSettingsPath={resolveSettingsPath}
              handleChangeSetting={handleChangeSetting}
              facilityId={facilityId}
              searchQuery={searchQuery}
              searchMeta={searchMeta}
              data-testid={`category-9y74-${testIdSuffix}`}
            />
          );
        }

        return (
          <SettingLine key={newPath} data-testid={`settingline-55rw-${testIdSuffix}`}>
            <SettingName
              depth={depth}
              disabled={disabled}
              requiresRestart={needsRestart}
              path={newPath}
              name={name}
              description={description}
              isSecret={isSecret}
              highRisk={schema.highRisk || highRisk}
              alignTop={isMultiEntry}
              searchQuery={searchQuery}
              data-testid={`settingname-g0r7-${testIdSuffix}`}
            />
            <SettingInput
              typeSchema={type}
              suggesterEndpoint={suggesterEndpoint}
              value={getSettingValue(newPath)}
              settingsPath={resolveSettingsPath(newPath)}
              defaultValue={defaultValue}
              globalValue={getGlobalSettingValue?.(newPath)}
              path={newPath}
              name={name}
              description={description}
              handleChangeSetting={handleChangeSetting}
              unit={unit}
              options={options}
              disabled={disabled}
              facilityId={facilityId}
              isSecret={isSecret}
              editor={editor}
              data-testid={`settinginput-2wuw-${testIdSuffix}`}
            />
            {/* actions column: reset to default — not shown for secrets (set
                only, never reset) or when the user can't edit this setting */}
            {!disabled && !isSecret && (
              <RowActions $alignTop={isMultiEntry}>
                <ResetToDefaultButton
                  value={getSettingValue(newPath)}
                  defaultValue={defaultValue}
                  globalValue={getGlobalSettingValue?.(newPath)}
                  onReset={() => handleChangeSetting(newPath, undefined)}
                />
              </RowActions>
            )}
            {showMatchedDescription && (
              <MatchedDescription $indent={depth} data-testid={`matcheddesc-${testIdSuffix}`}>
                {highlightMatches(description, searchQuery)}
              </MatchedDescription>
            )}
          </SettingLine>
        );
      })}
    </Wrapper>
  );
};
