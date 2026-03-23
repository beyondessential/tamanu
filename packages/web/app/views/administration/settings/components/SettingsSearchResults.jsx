import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

import { SETTINGS_SCOPES } from '@tamanu/constants';
import { BodyText, Heading5, TranslatedText } from '../../../../components';
import { Colors } from '../../../../constants/styles';

const ResultsContainer = styled.div`
  background-color: ${Colors.white};
  border: 1px solid ${Colors.outline};
  border-radius: 4px;
  margin-top: 0.5rem;
  max-height: 24rem;
  overflow-y: auto;
`;

const ResultGroup = styled.div`
  &:not(:last-child) {
    border-bottom: 1px solid ${Colors.outline};
  }
`;

const GroupHeader = styled.div`
  background-color: ${Colors.background};
  border-bottom: 1px solid ${Colors.outline};
  padding: 0.375rem 1rem;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const GroupLabel = styled(Heading5)`
  color: ${Colors.midText};
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
`;

const ResultRow = styled.div`
  align-items: baseline;
  cursor: pointer;
  display: grid;
  column-gap: 1rem;
  grid-template-columns: minmax(min-content, 14rem) 1fr;
  padding: 0.5rem 1rem;

  &:hover {
    background-color: ${Colors.veryLightBlue};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${Colors.outline}80;
  }
`;

const SettingName = styled(BodyText)`
  color: ${Colors.primary};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const SettingDescription = styled(BodyText)`
  color: ${Colors.midText};
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyMessage = styled(BodyText)`
  color: ${Colors.midText};
  padding: 1rem;
  text-align: center;
`;

const SCOPE_LABELS = {
  [SETTINGS_SCOPES.GLOBAL]: 'Global',
  [SETTINGS_SCOPES.CENTRAL]: 'Central',
  [SETTINGS_SCOPES.FACILITY]: 'Facility',
};

/**
 * Groups an array of result entries by scope, preserving the within-scope order
 * (which is already sorted by score descending, then name ascending).
 */
const groupByScope = (results) => {
  const groups = {};
  for (const result of results) {
    if (!groups[result.scope]) {
      groups[result.scope] = [];
    }
    groups[result.scope].push(result);
  }
  return groups;
};

/**
 * Displays the filtered list of settings matching the current search query.
 *
 * Props:
 *   searchResults   – array returned by useSettingsSearch
 *   onSelectResult  – called with the result object when the user clicks a row
 */
export const SettingsSearchResults = ({ searchResults, onSelectResult }) => {
  const handleClick = useCallback(
    (result) => {
      onSelectResult(result);
    },
    [onSelectResult],
  );

  if (searchResults.length === 0) {
    return (
      <ResultsContainer data-testid="settings-search-results-empty">
        <EmptyMessage data-testid="settings-search-no-results">
          <TranslatedText
            stringId="admin.settings.search.noResults"
            fallback="No settings found matching your search."
            data-testid="translatedtext-settings-search-no-results"
          />
        </EmptyMessage>
      </ResultsContainer>
    );
  }

  const grouped = groupByScope(searchResults);

  return (
    <ResultsContainer data-testid="settings-search-results">
      {Object.entries(grouped).map(([scope, results]) => (
        <ResultGroup key={scope} data-testid={`settings-search-group-${scope}`}>
          <GroupHeader data-testid={`settings-search-group-header-${scope}`}>
            <GroupLabel data-testid={`settings-search-group-label-${scope}`}>
              {SCOPE_LABELS[scope] ?? scope}
            </GroupLabel>
          </GroupHeader>
          {results.map((result) => (
            <ResultRow
              key={`${result.scope}:${result.path}`}
              onClick={() => handleClick(result)}
              data-testid={`settings-search-result-${result.scope}-${result.path}`}
            >
              <SettingName data-testid="settings-search-result-name">
                {result.name}
              </SettingName>
              {result.description ? (
                <SettingDescription
                  title={result.description}
                  data-testid="settings-search-result-description"
                >
                  {result.description}
                </SettingDescription>
              ) : (
                <Box />
              )}
            </ResultRow>
          ))}
        </ResultGroup>
      ))}
    </ResultsContainer>
  );
};
