import React, { useId, useState } from 'react';
import styled from 'styled-components';

import { OBJECT_ID_PERMISSION_SCHEMA } from '@tamanu/constants';
import { useTranslation } from '@tamanu/ui-components';
import { ThemedTooltip } from '../../../components/Tooltip';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { Colors } from '../../../constants';
import {
  CHEVRON_WIDTH,
  ChevronCell,
  DisclosureButton,
  EmptyChevronCell,
  NounRow,
  stickyLeft,
  StyledCheckbox,
  SummaryCell,
  VerbCheckCell,
  VerbLabelCell,
  VerbRow,
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

const GroupHeaderCell = styled.th.attrs({ scope: 'row' })`
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

const ChildNounCell = styled.th.attrs({ scope: 'row' })`
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
      <tbody>
        <NounRow onClick={() => setExpanded(prev => !prev)}>
          <EmptyChevronCell />
          <ChildNounCell>
            <ChildNounContent>
              <ChildChevron>
                <DisclosureButton
                  aria-controls={rowGroupId}
                  aria-expanded={expanded}
                  aria-label={disclosureLabel}
                />
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
                        {OBJECT_ID_PERMISSION_SCHEMA[nounGroup.noun]
                          .map(v => getVerbAbbreviation(v))
                          .join(' ')}
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
      </tbody>
      {expanded && (
        <tbody id={rowGroupId}>
          {nounGroup.verbs.map(({ verb }) => (
            <VerbRow key={verb}>
              <EmptyChevronCell />
              <ChildVerbLabelCell>
                {verb.charAt(0).toUpperCase() + verb.slice(1)}
              </ChildVerbLabelCell>
              {selectedRoles.map(role => (
                <VerbCheckCell key={role.id}>
                  <StyledCheckbox
                    checked={isChecked(verb, role.id)}
                    onClick={e => {
                      e.stopPropagation();
                      handleToggle(verb, role);
                    }}
                  />
                </VerbCheckCell>
              ))}
            </VerbRow>
          ))}
        </tbody>
      )}
    </>
  );
};

export const ObjectIdGroupSection = ({ noun, entries, selectedRoles, onToggle, objectNames }) => {
  const [expanded, setExpanded] = useState(false);

  const { getTranslation } = useTranslation();

  const disclosureLabel = expanded
    ? getTranslation('admin.permissions.collapseRow', 'Collapse :rowName row', {
        replacements: { noun },
      })
    : getTranslation('admin.permissions.expandRow', 'Expand :rowName row', {
        replacements: { noun },
      });

  return (
    <>
      <tbody>
        <GroupHeaderRow onClick={() => setExpanded(prev => !prev)}>
          <ChevronCell>
            {/* No aria-controls because of nested rowgroup troubles. See below. */}
            <DisclosureButton aria-expanded={expanded} aria-label={disclosureLabel} />
          </ChevronCell>
          <GroupHeaderCell>{noun} (Object ID)</GroupHeaderCell>
          {selectedRoles.map(role => (
            <GroupDashCell key={role.id}>&mdash;</GroupDashCell>
          ))}
        </GroupHeaderRow>
      </tbody>
      {/*
       * Not wrapped in a rowgroup (e.g. <tbody>) because nested rowgroups cause accessibility
       * issues for some browsers/readers. Also not wrapping in <div style="display: contents">
       * because <tbody> (rendered by ObjectIdChildSection) is not a valid child of <div>.
       */}
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
