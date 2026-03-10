import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import Checkbox from '@material-ui/core/Checkbox';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';

import { PERMISSION_SCHEMA, VERB_ABBREVIATIONS, VERB_HIERARCHY } from '@tamanu/constants';

import { ThemedTooltip } from '../../../components/Tooltip';
import { Colors } from '../../../constants';
import { CheckboxIconChecked, CheckboxIconUnchecked } from '../../../components/Icons/CheckboxIcon';

export const CHEVRON_WIDTH = 32;

const stickyLeft = (left, bg = Colors.white) => `
  position: sticky;
  left: ${left}px;
  background-color: ${bg};
  z-index: 1;
`;

const NounRow = styled.tr`
  cursor: pointer;
  &:hover {
    background-color: ${Colors.hoverGrey};
  }
`;

const ChevronCell = styled.td`
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

const SummaryCell = styled.td`
  text-align: center;
  padding: 10px 12px;
  border-bottom: 1px solid ${Colors.outline};
  color: ${Colors.darkestText};
  letter-spacing: 2px;
  font-size: 12px;
`;

const VerbRow = styled.tr`
  background-color: ${Colors.white};
`;

const VerbLabelCell = styled.td`
  padding: 4px 12px 4px 20px;
  color: ${Colors.darkestText};
  border-bottom: 1px solid ${Colors.outline};
  ${stickyLeft(CHEVRON_WIDTH, Colors.white)}
`;

const VerbCheckCell = styled.td`
  text-align: center;
  padding: 2px 12px;
  border-bottom: 1px solid ${Colors.outline};
`;

const StyledCheckbox = styled(Checkbox)`
  padding: 4px;
  &.Mui-checked {
    color: ${Colors.primary};
  }
`;

const EmptyChevronCell = styled.td`
  width: ${CHEVRON_WIDTH}px;
  border-bottom: 1px solid ${Colors.outline};
  text-align: left;
  ${stickyLeft(0, Colors.white)}
`;

function getImpliedVerbs(verb) {
  const idx = VERB_HIERARCHY.indexOf(verb);
  if (idx < 0 || idx >= VERB_HIERARCHY.length - 1) return [];
  return VERB_HIERARCHY.slice(idx + 1);
}

function getVerbAbbreviation(verb) {
  return VERB_ABBREVIATIONS[verb] || verb.charAt(0).toUpperCase();
}

export const NounSection = ({ nounGroup, selectedRoles, onToggle, objectNames }) => {
  const [expanded, setExpanded] = useState(false);

  const isChecked = (verb, roleId) => !!nounGroup.verbs.find(v => v.verb === verb)?.roles[roleId];

  const availableVerbs = useMemo(
    () => new Set(nounGroup.verbs.map(v => v.verb)),
    [nounGroup.verbs],
  );

  const handleToggle = (verb, role) => {
    const currentValue = isChecked(verb, role.id);
    const toggles = [
      {
        verb,
        noun: nounGroup.noun,
        objectId: nounGroup.objectId,
        roleId: role.id,
        hasPermission: currentValue,
      },
    ];

    if (!currentValue) {
      // Granting permission: also grant implied lower-level verbs
      for (const implied of getImpliedVerbs(verb)) {
        if (availableVerbs.has(implied) && !isChecked(implied, role.id)) {
          toggles.push({
            verb: implied,
            noun: nounGroup.noun,
            objectId: nounGroup.objectId,
            roleId: role.id,
            hasPermission: false,
          });
        }
      }
    } else {
      // Revoking permission: also revoke superior verbs that imply this one
      const superiorVerbs = VERB_HIERARCHY.slice(0, VERB_HIERARCHY.indexOf(verb));
      for (const superior of superiorVerbs) {
        if (availableVerbs.has(superior) && isChecked(superior, role.id)) {
          toggles.push({
            verb: superior,
            noun: nounGroup.noun,
            objectId: nounGroup.objectId,
            roleId: role.id,
            hasPermission: true, // true means revoke
          });
        }
      }
    }

    onToggle(toggles);
  };

  const getSummary = roleId =>
    nounGroup.verbs
      .filter(v => isChecked(v.verb, roleId))
      .map(v => getVerbAbbreviation(v.verb))
      .join(' ');

  return (
    <>
      <NounRow onClick={() => setExpanded(prev => !prev)}>
        <ChevronCell>
          {expanded ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
        </ChevronCell>
        <NounCell>
          <ThemedTooltip
            title={
              PERMISSION_SCHEMA[nounGroup.noun] ? (
                <>
                  {nounGroup.objectId && objectNames[`${nounGroup.noun}#${nounGroup.objectId}`] && (
                    <>
                      {objectNames[`${nounGroup.noun}#${nounGroup.objectId}`]}
                      <br />
                    </>
                  )}
                  Permissions available:
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
