import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import Checkbox from '@material-ui/core/Checkbox';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

import { PERMISSION_SCHEMA } from '@tamanu/constants';

import { ThemedTooltip } from '../../../components/Tooltip';
import { Colors } from '../../../constants';
import { CheckboxIconChecked, CheckboxIconUnchecked } from '../../../components/Icons/CheckboxIcon';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
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

export const ChevronCell = styled.td`
  width: ${CHEVRON_WIDTH}px;
  padding: 6px 4px 6px 12px;
  border-bottom: 1px solid ${Colors.outline};
  color: ${Colors.midText};
  vertical-align: middle;
  text-align: left;
  ${stickyLeft(0)}
`;

const NounCell = styled.td`
  padding: 10px 12px 10px 10px;
  color: ${Colors.darkestText};
  border-bottom: 1px solid ${Colors.outline};
  text-align: left;
  ${stickyLeft(CHEVRON_WIDTH)}
`;

export const SummaryCell = styled.td`
  text-align: left;
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
  text-align: left;
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
  text-align: left;
  ${stickyLeft(0, Colors.white)}
`;

export const NounSection = ({ nounGroup, selectedRoles, onToggle, objectNames }) => {
  const [expanded, setExpanded] = useState(false);
  const { isChecked, handleToggle, getSummary } = usePermissionToggles(nounGroup, onToggle);

  const objectName = nounGroup.objectId
    ? objectNames[`${nounGroup.noun}#${nounGroup.objectId}`]
    : null;

  return (
    <>
      <NounRow aria-expanded={expanded} onClick={() => setExpanded(prev => !prev)}>
        <ChevronCell>
          {expanded ? (
            <KeyboardArrowDown fontSize="small" />
          ) : (
            <KeyboardArrowRight fontSize="small" />
          )}
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
            <span>{nounGroup.nounKey}</span>
          </ThemedTooltip>
        </NounCell>
        {selectedRoles.map(role => (
          <SummaryCell key={role.id}>{getSummary(role.id)}</SummaryCell>
        ))}
      </NounRow>
      {expanded &&
        nounGroup.verbs.map(({ verb }) => (
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
    </>
  );
};
