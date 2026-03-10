import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';

import { VERB_HIERARCHY } from '@tamanu/constants';

import { ThemedTooltip } from '../../../components/Tooltip';
import { Colors } from '../../../constants';
import { CheckboxIconChecked, CheckboxIconUnchecked } from '../../../components/Icons/CheckboxIcon';
import {
  CHEVRON_WIDTH,
  ChevronCell,
  NounRow,
  SummaryCell,
  VerbRow,
  VerbLabelCell,
  VerbCheckCell,
  StyledCheckbox,
  EmptyChevronCell,
  getImpliedVerbs,
  getVerbAbbreviation,
  stickyLeft,
} from './NounSection';

const GroupHeaderRow = styled.tr`
  cursor: pointer;
  background-color: ${Colors.background};
  &:hover {
    background-color: ${Colors.hoverGrey};
  }
`;

const GroupHeaderCell = styled.td`
  padding: 10px 12px 10px 10px;
  color: ${Colors.midText};
  font-weight: 500;
  border-bottom: 1px solid ${Colors.outline};
  text-align: left;
  ${stickyLeft(CHEVRON_WIDTH)}
`;

const GroupDashCell = styled.td`
  text-align: center;
  padding: 10px 12px;
  border-bottom: 1px solid ${Colors.outline};
  color: ${Colors.midText};
`;

const ChildNounCell = styled.td`
  padding: 10px 12px 10px 0px;
  color: ${Colors.darkestText};
  border-bottom: 1px solid ${Colors.outline};
  text-align: left;
  ${stickyLeft(CHEVRON_WIDTH)}
`;

const ChildNounContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TruncatedName = styled.span`
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
`;

const ChildChevron = styled.span`
  color: ${Colors.midText};
  display: inline-flex;
  flex-shrink: 0;
`;

const ChildVerbLabelCell = styled(VerbLabelCell)`
  padding-left: 55px;
`;

const ObjectIdChildSection = ({ nounGroup, selectedRoles, onToggle, objectNames }) => {
  const [expanded, setExpanded] = useState(false);
  const displayName =
    objectNames[`${nounGroup.noun}#${nounGroup.objectId}`] || nounGroup.objectId;

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
      const superiorVerbs = VERB_HIERARCHY.slice(0, VERB_HIERARCHY.indexOf(verb));
      for (const superior of superiorVerbs) {
        if (availableVerbs.has(superior) && isChecked(superior, role.id)) {
          toggles.push({
            verb: superior,
            noun: nounGroup.noun,
            objectId: nounGroup.objectId,
            roleId: role.id,
            hasPermission: true,
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
        <EmptyChevronCell />
        <ChildNounCell>
          <ChildNounContent>
            <ChildChevron>
              {expanded ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
            </ChildChevron>
            <ThemedTooltip title={`${displayName} (${nounGroup.objectId})`}>
              <TruncatedName>{displayName}</TruncatedName>
            </ThemedTooltip>
          </ChildNounContent>
        </ChildNounCell>
        {selectedRoles.map(role => (
          <SummaryCell key={role.id}>{getSummary(role.id)}</SummaryCell>
        ))}
      </NounRow>
      {expanded &&
        nounGroup.verbs.map(({ verb }) => (
          <VerbRow key={verb}>
            <EmptyChevronCell />
            <ChildVerbLabelCell>{verb.charAt(0).toUpperCase() + verb.slice(1)}</ChildVerbLabelCell>
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

export const ObjectIdGroupSection = ({ noun, entries, selectedRoles, onToggle, objectNames }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <GroupHeaderRow onClick={() => setExpanded(prev => !prev)}>
        <ChevronCell>
          {expanded ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
        </ChevronCell>
        <GroupHeaderCell>{noun} (Object ID)</GroupHeaderCell>
        {selectedRoles.map(role => (
          <GroupDashCell key={role.id}>-</GroupDashCell>
        ))}
      </GroupHeaderRow>
      {expanded &&
        entries.map(entry => (
          <ObjectIdChildSection
            key={entry.objectId}
            nounGroup={entry}
            selectedRoles={selectedRoles}
            onToggle={onToggle}
            objectNames={objectNames}
          />
        ))}
    </>
  );
};
