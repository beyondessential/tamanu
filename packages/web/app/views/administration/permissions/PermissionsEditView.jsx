import React, { useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAuth, useTranslation } from '@tamanu/ui-components';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { FilterField } from '../../../components/Field/FilterField';
import { AutocompleteField } from '../../../components/Field/AutocompleteField';
import { Colors } from '../../../constants';
import { ThemedTooltip } from '../../../components/Tooltip';
import { useTogglePermissionMutation } from '../../../api/mutations';
import { useAdminPermissionRolesQuery } from '../../../api/queries/useAdminPermissionRolesQuery';
import { useAdminPermissionsQuery } from '../../../api/queries/useAdminPermissionsQuery';
import { NounSection, CHEVRON_WIDTH } from './NounSection';
import { ObjectIdGroupSection } from './ObjectIdGroupSection';
import { buildNouns } from './utils';
import { useNounOptions } from './useNounOptions';
import { useFilteredNouns } from './useFilteredNouns';
import { NOUN_TYPES } from './constants';
import { NoPermissionScreen } from '../../NoPermissionScreen';

const OuterContainer = styled.div`
  display: grid;
  background-color: ${Colors.background};
  min-height: 0;
  padding: 20px;
  gap: 0;
`;

const EditContainer = styled.div`
  overflow-x: auto;
  overflow-y: auto;
  display: grid;
`;

const FiltersRow = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  padding-left: 40px;
  padding-top: 10px;
  padding-bottom: 10px;
  border: 1px solid ${Colors.outline};
  background-color: ${Colors.white};
`;

const FilterFieldContainer = styled.div`
  min-width: 260px;

  .MuiButton-root {
    height: 40px;
  }

  .MuiInputBase-root {
    height: 40px;
    width: 250px;
  }
`;

const MatrixTable = styled.table`
  min-width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const ChevronTh = styled.th`
  width: ${CHEVRON_WIDTH}px;
  padding: 0;
  border-bottom: 1px solid ${Colors.outline};
  text-align: left;
  position: sticky;
  top: 0;
  left: 0;
  background-color: ${Colors.white};
  z-index: 2;
`;

const NounTh = styled.th`
  text-align: left;
  padding: 10px 12px 10px 10px;
  border-bottom: 1px solid ${Colors.outline};
  font-weight: 400;
  color: ${Colors.midText};
  position: sticky;
  top: 0;
  left: ${CHEVRON_WIDTH}px;
  background-color: ${Colors.white};
  z-index: 2;
  width: 0;
  white-space: nowrap;
`;

const RoleTh = styled.th`
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid ${Colors.outline};
  font-weight: 400;
  color: ${Colors.midText};
  max-width: 120px;
  min-width: 120px;
  position: sticky;
  top: 0;
  background-color: ${Colors.white};
  z-index: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EmptyMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: ${Colors.midText};
`;

const StyledNoPermissionContainer = styled(NoPermissionScreen)`
  border: none;
`;

export const PermissionsEditView = () => {
  const { getTranslation } = useTranslation();
  const { ability } = useAuth();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [selectedNoun, setSelectedNoun] = useState(null);

  const { data: rolesData = {} } = useAdminPermissionRolesQuery();

  const allRoles = useMemo(() => rolesData.roles ?? [], [rolesData]);
  const selectedRoles = useMemo(
    () => allRoles.filter(r => selectedRoleIds.includes(r.id)),
    [allRoles, selectedRoleIds],
  );

  const rolesQueryParam = useMemo(
    () => (selectedRoleIds.length > 0 ? selectedRoleIds.join(',') : undefined),
    [selectedRoleIds],
  );

  const {
    data: permissionsData = {},
    isLoading,
    isFetching,
    isSuccess,
    error,
  } = useAdminPermissionsQuery(rolesQueryParam);

  const permissions = useMemo(() => permissionsData.permissions ?? [], [permissionsData]);
  const objectNames = useMemo(() => permissionsData.objectNames ?? {}, [permissionsData]);

  // If no roles are selected, display all roles
  const rolesToDisplay = useMemo(
    () => (selectedRoles.length > 0 ? selectedRoles : allRoles),
    [selectedRoles, allRoles],
  );
  const rolesIdsToDisplay = useMemo(() => rolesToDisplay.map(r => r.id), [rolesToDisplay]);

  const allNouns = useMemo(
    () => buildNouns(permissions, rolesIdsToDisplay),
    [permissions, rolesIdsToDisplay],
  );

  // Builds the noun options for the Noun Autocomplete Field to filter the nouns
  const nounOptions = useNounOptions(permissions, objectNames);

  // Filters the nouns for permission matrix based on the selected noun
  const filteredNouns = useFilteredNouns(allNouns, selectedNoun);

  const handleRoleChange = useCallback(event => {
    setSelectedRoleIds(event.target.value ?? []);
  }, []);

  const handleNounChange = useCallback(event => {
    setSelectedNoun(event.target.value ?? null);
  }, []);

  const togglePermission = useTogglePermissionMutation(rolesQueryParam);

  const handleToggle = useCallback(params => togglePermission.mutate(params), [togglePermission]);

  const isActuallyLoading = isLoading && isFetching;

  const hasReadPermission = ability.can('read', 'Permission');

  if (!hasReadPermission) {
    return <StyledNoPermissionContainer showBackgroundImage />;
  }

  return (
    <OuterContainer>
      <FiltersRow data-testid="permissions-edit-filters-row">
        <FilterFieldContainer>
          <AutocompleteField
            placeholder={getTranslation('admin.permissions.searchNounPlaceholder', 'Select noun')}
            field={{ name: 'noun', value: selectedNoun, onChange: handleNounChange }}
            options={nounOptions}
            allowFreeTextForExistingValue
            data-testid="permissions-noun-select"
          />
        </FilterFieldContainer>
        <FilterFieldContainer>
          <FilterField
            label={getTranslation('admin.permissions.role.label', 'Role')}
            field={{ name: 'roles', value: selectedRoleIds, onChange: handleRoleChange }}
            endpoint="role"
            data-testid="permissions-role-select"
          />
        </FilterFieldContainer>
      </FiltersRow>
      <EditContainer data-testid="permissions-edit-container">
        {isActuallyLoading && <LoadingIndicator data-testid="permissions-loading-indicator" />}
        {error && (
          <ErrorMessage
            title={
              <TranslatedText
                stringId="admin.permissions.error.load"
                fallback="Error loading permissions"
                data-testid="translatedtext-lr7h"
              />
            }
            error={error}
            data-testid="permissions-error-message"
          />
        )}
        {isSuccess && rolesToDisplay.length > 0 && filteredNouns.length > 0 && (
          <MatrixTable>
            <thead>
              <tr>
                <ChevronTh />
                <NounTh>
                  <TranslatedText
                    stringId="admin.permissions.noun.label"
                    fallback="Noun"
                    data-testid="translatedtext-noun-header"
                  />
                </NounTh>
                {rolesToDisplay.map(role => (
                  <RoleTh key={role.id}>
                    <ThemedTooltip title={role.name}>
                      <span>{role.name}</span>
                    </ThemedTooltip>
                  </RoleTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredNouns.map(group =>
                group.type === NOUN_TYPES.NOUN ? (
                  <NounSection
                    key={group.data.nounKey}
                    nounGroup={group.data}
                    selectedRoles={rolesToDisplay}
                    onToggle={handleToggle}
                    objectNames={objectNames}
                  />
                ) : (
                  <ObjectIdGroupSection
                    key={`objectId-${group.data.noun}`}
                    noun={group.data.noun}
                    entries={group.data.children}
                    selectedRoles={rolesToDisplay}
                    onToggle={handleToggle}
                    objectNames={objectNames}
                  />
                ),
              )}
            </tbody>
          </MatrixTable>
        )}
        {isSuccess && selectedRoles.length > 0 && filteredNouns.length === 0 && (
          <EmptyMessage>
            <TranslatedText
              stringId="admin.permissions.noPermissions"
              fallback="No permissions found for the selected roles"
              data-testid="translatedtext-no-perms"
            />
          </EmptyMessage>
        )}
      </EditContainer>
    </OuterContainer>
  );
};
