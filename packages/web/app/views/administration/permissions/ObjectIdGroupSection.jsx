import React, { useState } from 'react';
import styled from 'styled-components';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

import { OBJECT_ID_PERMISSION_SCHEMA } from '@tamanu/constants';

import { ThemedTooltip } from '../../../components/Tooltip';
import { Colors } from '../../../constants';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
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
  stickyLeft,
} from './NounSection';
import { getVerbAbbreviation, usePermissionToggles } from './usePermissionToggles';

// Additional indentation for nested items to account for the child chevron icon and spacing
const CHILD_INDENT = 35;

const GroupHeaderRow = styled.tr`
  cursor: pointer;
  &:hover {
    background-color: ${Colors.veryLightBlue};
  }
`;

const GroupHeaderCell = styled.td`
  padding: 10px 12px 10px 10px;
  color: ${Colors.darkestText};
  border-bottom: 1px solid ${Colors.outline};
  text-align: left;
  ${stickyLeft(CHEVRON_WIDTH)}
`;

const GroupDashCell = styled.td`
  text-align: center;
  padding: 10px 12px;
  background-color: ${Colors.white};
  border-bottom: 1px solid ${Colors.outline};
  tr:hover > & {
    background-color: ${Colors.veryLightBlue};
  }
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
  padding-left: ${20 + CHILD_INDENT}px;
`;

const ObjectIdChildSection = ({ nounGroup, selectedRoles, onToggle, objectNames }) => {
  const [expanded, setExpanded] = useState(false);
  const displayName = objectNames[`${nounGroup.noun}#${nounGroup.objectId}`] ?? nounGroup.objectId;
  const { isChecked, handleToggle, getSummary } = usePermissionToggles(nounGroup, onToggle);

  return (
    <>
      <NounRow aria-expanded={expanded} onClick={() => setExpanded(prev => !prev)}>
        <EmptyChevronCell />
        <ChildNounCell>
          <ChildNounContent>
            <ChildChevron>
              {expanded ? (
                <KeyboardArrowDown fontSize="small" />
              ) : (
                <KeyboardArrowRight fontSize="small" />
              )}
            </ChildChevron>
            <ThemedTooltip
              title={
                <>
                  {displayName} ({nounGroup.objectId})
                  {OBJECT_ID_PERMISSION_SCHEMA[nounGroup.noun] && (
                    <>
                      <br />
                      <TranslatedText
                        stringId="admin.permissions.available"
                        fallback="Permissions available:"
                        data-testid="translatedtext-permissions-available-objectid"
                      />
                      <br />
                      {OBJECT_ID_PERMISSION_SCHEMA[nounGroup.noun].map(v => getVerbAbbreviation(v)).join(' ')}
                    </>
                  )}
                </>
              }
            >
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
          {expanded ? (
            <KeyboardArrowDown fontSize="small" />
          ) : (
            <KeyboardArrowRight fontSize="small" />
          )}
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
