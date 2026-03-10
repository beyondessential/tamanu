import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { FilterField } from '../../../components/Field/FilterField';
import { Colors } from '../../../constants';
import { useTogglePermissionMutation } from '../../../api/mutations';
import { NounSection, CHEVRON_WIDTH } from './NounSection';

const EditContainer = styled.div`
  margin: 20px;
  overflow-x: auto;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
`;

const FilterFieldContainer = styled.div`
  min-width: 280px;
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

function buildNounGroups(permissions, selectedRoleIds) {
  const nounMap = {};

  for (const perm of permissions) {
    const { verb, noun, objectId } = perm;
    const nounKey = objectId ? `${noun} (${objectId})` : noun;
    if (!nounMap[nounKey]) {
      nounMap[nounKey] = { nounKey, noun, objectId: objectId || null, verbs: {} };
    }
    if (!nounMap[nounKey].verbs[verb]) {
      nounMap[nounKey].verbs[verb] = {};
    }
    for (const roleId of selectedRoleIds) {
      nounMap[nounKey].verbs[verb][roleId] = perm[roleId] === 'y';
    }
  }

  return Object.values(nounMap)
    .map(group => ({
      ...group,
      verbs: Object.entries(group.verbs).map(([verb, roles]) => ({ verb, roles })),
    }))
    .sort((a, b) => a.nounKey.localeCompare(b.nounKey));
}

export const PermissionsEditView = () => {
  const api = useApi();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

  const { data: rolesData } = useQuery(['adminPermissionRoles'], () =>
    api.get('admin/permissions/roles'),
  );

  const allRoles = useMemo(() => {
    const roles = rolesData?.roles || rolesData?.data?.roles || [];
    return roles;
  }, [rolesData]);

  const selectedRoles = useMemo(
    () => allRoles.filter(r => selectedRoleIds.includes(r.id)),
    [allRoles, selectedRoleIds],
  );

  const rolesQueryParam = useMemo(() => selectedRoleIds.join(','), [selectedRoleIds]);

  const {
    data: permData,
    isLoading,
    error,
  } = useQuery(
    ['adminPermissions', rolesQueryParam],
    () => api.get('admin/permissions', { roles: rolesQueryParam }),
    { enabled: selectedRoleIds.length > 0 },
  );

  const permissions = useMemo(() => {
    return permData?.permissions || permData?.data?.permissions || [];
  }, [permData]);

  const objectNames = useMemo(() => {
    return permData?.objectNames || permData?.data?.objectNames || {};
  }, [permData]);

  const nounGroups = useMemo(
    () => buildNounGroups(permissions, selectedRoleIds),
    [permissions, selectedRoleIds],
  );

  const handleRoleChange = useCallback(event => {
    setSelectedRoleIds(event.target.value || []);
  }, []);

  const togglePermission = useTogglePermissionMutation(rolesQueryParam);

  const handleToggle = useCallback(
    params => togglePermission.mutate(params),
    [togglePermission],
  );

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
          <FilterField
            label="Role"
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
      {!isLoading && !error && selectedRoles.length > 0 && nounGroups.length > 0 && (
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
            {nounGroups.map(nounGroup => (
              <NounSection
                key={nounGroup.nounKey}
                nounGroup={nounGroup}
                selectedRoles={selectedRoles}
                onToggle={handleToggle}
                objectNames={objectNames}
              />
            ))}
          </tbody>
        </MatrixTable>
      )}
      {!isLoading && !error && selectedRoles.length > 0 && nounGroups.length === 0 && (
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
