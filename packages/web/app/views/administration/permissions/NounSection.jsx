import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import React, { useId, useState } from 'react';
import styled, { css } from 'styled-components';

import { PERMISSION_NOUN_DISPLAY_NAMES, PERMISSION_SCHEMA } from '@tamanu/constants';
import { useTranslation } from '@tamanu/ui-components';
import { CheckboxIconChecked, CheckboxIconUnchecked } from '../../../components/Icons/CheckboxIcon';
import { ThemedTooltip } from '../../../components/Tooltip';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { Colors } from '../../../constants';
import { getVerbAbbreviation, usePermissionToggles } from './usePermissionToggles';

export const CHEVRON_WIDTH = 32;

export const stickyLeft = (left, bg = Colors.white) => css`
  position: sticky;
  left: ${left}px;
  background-color: ${bg};
  z-index: 1;
  tr:hover > & {
    background-color: ${Colors.veryLightBlue};
  }
`;

export const NounRow = styled.tr`
  cursor: pointer;
  &:hover {
    background-color: ${Colors.veryLightBlue};
  }
`;

export const RowGroup = styled.div.attrs({ role: 'rowgroup' })`
  display: contents;
`;

const DisclosureIcon = styled(KeyboardArrowRight).attrs({
  fontSize: 'small',
})`
  transition: ${({ theme: { transitions } }) =>
    transitions.create(['rotate'], {
      duration: transitions.duration.shortest,
      easing: transitions.easing.easeOut,
    })};

  [aria-expanded='true'] & {
    rotate: 90deg;
  }
`;

export const DisclosureButton = props => (
  <IconButton size="small" {...props}>
    <DisclosureIcon />
  </IconButton>
);

export const ChevronCell = styled.td`
  width: ${CHEVRON_WIDTH}px;
  padding: 6px 4px 6px 12px;
  border-bottom: 1px solid ${Colors.outline};
  color: ${Colors.midText};
  vertical-align: middle;
  text-align: start;
  ${stickyLeft(0)}
`;

const NounCell = styled.td`
  padding: 10px 12px 10px 10px;
  color: ${Colors.darkestText};
  border-bottom: 1px solid ${Colors.outline};
  text-align: start;
  ${stickyLeft(CHEVRON_WIDTH)}
`;

export const SummaryCell = styled.td`
  text-align: start;
  padding: 10px 12px;
  border-bottom: 1px solid ${Colors.outline};
  color: ${Colors.darkestText};
  background-color: ${Colors.white};
  font-size: 12px;
  font-family: monospace;
  letter-spacing: 1px;
  white-space: pre;
  tr:hover > & {
    background-color: ${Colors.veryLightBlue};
  }
`;

export const VerbRow = styled.tr`
  background-color: ${Colors.white};
`;

export const VerbLabelCell = styled.td`
  padding: 4px 12px 4px 20px;
  color: ${Colors.darkestText};
  ${stickyLeft(CHEVRON_WIDTH, Colors.white)}
`;

export const VerbCheckCell = styled.td`
  text-align: start;
  padding: 10px 8px;
`;

export const StyledCheckbox = styled(Checkbox)`
  padding: 4px;
  &.Mui-checked {
    color: ${Colors.primary};
  }
`;

export const EmptyChevronCell = styled.td`
  width: ${CHEVRON_WIDTH}px;
  text-align: start;
  ${stickyLeft(0, Colors.white)}
`;

export const NounSection = ({ nounGroup, selectedRoles, onToggle, objectNames }) => {
  const [expanded, setExpanded] = useState(false);
  const { isChecked, handleToggle, getSummary } = usePermissionToggles(nounGroup, onToggle);

  const objectName = nounGroup.objectId
    ? objectNames[`${nounGroup.noun}#${nounGroup.objectId}`]
    : null;

  const displayName = PERMISSION_NOUN_DISPLAY_NAMES[nounGroup.noun] ?? nounGroup.nounKey;

  const rowGroupId = useId();

  const { getTranslation } = useTranslation();
  const disclosureLabel = expanded
    ? getTranslation('admin.permissions.collapseRow', 'Collapse :rowName row', {
        replacements: { rowName: displayName },
      })
    : getTranslation('admin.permissions.expandRow', 'Expand :rowName row', {
        replacements: { rowName: displayName },
      });

  return (
    <>
      <NounRow onClick={() => setExpanded(prev => !prev)}>
        <ChevronCell>
          <DisclosureButton
            aria-controls={rowGroupId}
            aria-expanded={expanded}
            aria-label={disclosureLabel}
          />
        </ChevronCell>
        <NounCell>
          <ThemedTooltip
            title={
              PERMISSION_SCHEMA[nounGroup.noun] ? (
                <>
                  {objectName && (
                    <>
                      {objectName}
                      <br />
                    </>
                  )}
                  <TranslatedText
                    stringId="admin.permissions.available"
                    fallback="Permissions available:"
                    data-testid="translatedtext-permissions-available"
                  />
                  <br />
                  {PERMISSION_SCHEMA[nounGroup.noun].map(v => getVerbAbbreviation(v)).join(' ')}
                </>
              ) : (
                nounGroup.nounKey
              )
            }
          >
            <span>{displayName}</span>
          </ThemedTooltip>
        </NounCell>
        {selectedRoles.map(role => (
          <SummaryCell key={role.id}>{getSummary(role.id)}</SummaryCell>
        ))}
      </NounRow>
      {expanded && (
        <RowGroup id={rowGroupId}>
          {nounGroup.verbs.map(({ verb }) => (
            <VerbRow key={verb}>
              <EmptyChevronCell />
              <VerbLabelCell>{verb.charAt(0).toUpperCase() + verb.slice(1)}</VerbLabelCell>
              {selectedRoles.map(role => (
                <VerbCheckCell key={role.id}>
                  <StyledCheckbox
                    checked={isChecked(verb, role.id)}
                    icon={<CheckboxIconUnchecked width={15} height={15} />}
                    checkedIcon={<CheckboxIconChecked width={15} height={15} />}
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      handleToggle(verb, role);
                    }}
                  />
                </VerbCheckCell>
              ))}
            </VerbRow>
          ))}
        </RowGroup>
      )}
    </>
  );
};
