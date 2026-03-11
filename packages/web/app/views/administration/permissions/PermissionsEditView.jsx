import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '@tamanu/ui-components';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { FilterField } from '../../../components/Field/FilterField';
import { AutocompleteField } from '../../../components/Field/AutocompleteField';
import { Colors } from '../../../constants';
import { useTogglePermissionMutation } from '../../../api/mutations';
import { useAdminPermissionRolesQuery } from '../../../api/queries/useAdminPermissionRolesQuery';
import { useAdminPermissionsQuery } from '../../../api/queries/useAdminPermissionsQuery';
import { NounSection, CHEVRON_WIDTH } from './NounSection';
import { ObjectIdGroupSection } from './ObjectIdGroupSection';
import { buildNouns } from './utils';
import { useNounOptions } from './useNounOptions';
import { useFilteredNouns } from './useFilteredNouns';

const EditContainer = styled.div`
  margin: 20px;
  overflow-x: auto;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 20px;
`;

const FilterFieldContainer = styled.div`
  min-width: 280px;

  .MuiButton-root {
    height: 40px;
  }

  .MuiInputBase-root {
    height: 40px;
    width: 250px;
  }
`;

const MatrixTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const ChevronTh = styled.th`
  width: ${CHEVRON_WIDTH}px;
  padding: 0;
  border-bottom: 2px solid ${Colors.outline};
  text-align: left;
  position: sticky;
  top: 0;
  left: 0;
  background-color: ${Colors.white};
  z-index: 2;
`;

const NounTh = styled.th`
  text-align: left;
  padding: 10px 12px 10px 40px;
  border-bottom: 2px solid ${Colors.outline};
  font-weight: 400;
  color: ${Colors.midText};
  position: sticky;
  top: 0;
  left: ${CHEVRON_WIDTH}px;
  background-color: ${Colors.white};
  z-index: 2;
`;

const RoleTh = styled.th`
  text-align: center;
  padding: 10px 12px;
  border-bottom: 2px solid ${Colors.outline};
  font-weight: 400;
  color: ${Colors.midText};
  white-space: nowrap;
  min-width: 100px;
  position: sticky;
  top: 0;
  background-color: ${Colors.white};
  z-index: 1;
`;

const EmptyMessage = styled.div`
  padding: 40px;
  text-align: center;
  color: ${Colors.midText};
`;

export const PermissionsEditView = () => {
  const { getTranslation } = useTranslation();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [selectedNoun, setSelectedNoun] = useState(null);

  const { data: rolesData = [] } = useAdminPermissionRolesQuery();

  const allRoles = useMemo(() => rolesData.roles ?? [], [rolesData]);
  const selectedRoles = useMemo(
    () => allRoles.filter(r => selectedRoleIds.includes(r.id)),
    [allRoles, selectedRoleIds],
  );

  const rolesQueryParam = useMemo(() => selectedRoleIds.join(','), [selectedRoleIds]);

  const {
    data: permissionsData = {},
    isLoading,
    error,
  } = useAdminPermissionsQuery(rolesQueryParam, { enabled: selectedRoleIds.length > 0 });

  const permissions = useMemo(() => permissionsData.permissions ?? [], [permissionsData]);
  const objectNames = useMemo(() => permissionsData.objectNames ?? {}, [permissionsData]);

  const allNouns = useMemo(
    () => buildNouns(permissions, selectedRoleIds),
    [permissions, selectedRoleIds],
  );

  const nounOptions = useNounOptions(permissions, objectNames);

  const filteredNouns = useFilteredNouns(allNouns, selectedNoun);

  const handleRoleChange = useCallback(event => {
    setSelectedRoleIds(event.target.value || []);
  }, []);

  const handleNounChange = useCallback(event => {
    setSelectedNoun(event.target.value || null);
  }, []);

  const togglePermission = useTogglePermissionMutation(rolesQueryParam);

  const handleToggle = useCallback(params => togglePermission.mutate(params), [togglePermission]);

  useEffect(() => {
    if (allRoles.length > 0 && selectedRoleIds.length === 0) {
      setSelectedRoleIds(allRoles.map(r => r.id));
    }
    // we only want to select all roles on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRoles]);

  return (
    <EditContainer data-testid="permissions-edit-container">
      <FiltersRow data-testid="permissions-edit-filters-row">
        <FilterFieldContainer>
          <AutocompleteField
            placeholder={getTranslation('admin.permissions.searchNounPlaceholder', 'Search noun')}
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
      {isLoading && <LoadingIndicator data-testid="permissions-loading-indicator" />}
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
      {!isLoading && !error && selectedRoles.length > 0 && filteredNouns.length > 0 && (
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
              {selectedRoles.map(role => (
                <RoleTh key={role.id}>{role.name}</RoleTh>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredNouns.map(group =>
              group.type === 'noun' ? (
                <NounSection
                  key={group.data.nounKey}
                  nounGroup={group.data}
                  selectedRoles={selectedRoles}
                  onToggle={handleToggle}
                  objectNames={objectNames}
                />
              ) : (
                <ObjectIdGroupSection
                  key={`objectId-${group.data.noun}`}
                  noun={group.data.noun}
                  entries={group.data.children}
                  selectedRoles={selectedRoles}
                  onToggle={handleToggle}
                  objectNames={objectNames}
                />
              ),
            )}
          </tbody>
        </MatrixTable>
      )}
      {!isLoading && !error && selectedRoles.length > 0 && filteredNouns.length === 0 && (
        <EmptyMessage>
          <TranslatedText
            stringId="admin.permissions.noPermissions"
            fallback="No permissions found for the selected roles"
            data-testid="translatedtext-no-perms"
          />
        </EmptyMessage>
      )}
      {!isLoading && selectedRoleIds.length === 0 && (
        <EmptyMessage>
          <TranslatedText
            stringId="admin.permissions.selectRoles"
            fallback="Select roles to view permissions"
            data-testid="translatedtext-select-roles"
          />
        </EmptyMessage>
      )}
    </EditContainer>
  );
};
