import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';

import { PERMISSION_SCHEMA } from '@tamanu/constants';
import { useTranslation } from '@tamanu/ui-components';

import { useApi } from '../../../api';
import { ErrorMessage } from '../../../components/ErrorMessage';
import { LoadingIndicator } from '../../../components/LoadingIndicator';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { FilterField } from '../../../components/Field/FilterField';
import { AutocompleteField } from '../../../components/Field/AutocompleteField';
import { Colors } from '../../../constants';
import { useTogglePermissionMutation } from '../../../api/mutations';
import { NounSection, CHEVRON_WIDTH } from './NounSection';
import { ObjectIdGroupSection } from './ObjectIdGroupSection';

const BASE_NOUN_OPTIONS = Object.keys(PERMISSION_SCHEMA)
  .filter(n => n !== 'all')
  .sort()
  .map(noun => ({ value: noun, label: noun }));

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

function buildNounGroups(permissions, selectedRoleIds) {
  const regularMap = {};
  const objectIdMap = {};

  for (const perm of permissions) {
    const { verb, noun, objectId } = perm;
    if (objectId) {
      const nounKey = `${noun} (${objectId})`;
      if (!objectIdMap[noun]) objectIdMap[noun] = {};
      if (!objectIdMap[noun][objectId]) {
        objectIdMap[noun][objectId] = { nounKey, noun, objectId, verbs: {} };
      }
      if (!objectIdMap[noun][objectId].verbs[verb]) {
        objectIdMap[noun][objectId].verbs[verb] = {};
      }
      for (const roleId of selectedRoleIds) {
        objectIdMap[noun][objectId].verbs[verb][roleId] = perm[roleId] === 'y';
      }
    } else {
      if (!regularMap[noun]) {
        regularMap[noun] = { nounKey: noun, noun, objectId: null, verbs: {} };
      }
      if (!regularMap[noun].verbs[verb]) {
        regularMap[noun].verbs[verb] = {};
      }
      for (const roleId of selectedRoleIds) {
        regularMap[noun].verbs[verb][roleId] = perm[roleId] === 'y';
      }
    }
  }

  const finalise = group => ({
    ...group,
    verbs: Object.entries(group.verbs).map(([verb, roles]) => ({ verb, roles })),
  });

  const regularGroups = Object.values(regularMap)
    .map(finalise)
    .map(g => ({ type: 'noun', noun: g.nounKey, data: g }));

  const objectIdGroups = Object.entries(objectIdMap).map(([noun, entries]) => ({
    type: 'objectId',
    noun,
    data: {
      noun,
      children: Object.values(entries)
        .map(finalise)
        .sort((a, b) => a.objectId.localeCompare(b.objectId)),
    },
  }));

  return [...regularGroups, ...objectIdGroups].sort((a, b) => a.noun.localeCompare(b.noun));
}

export const PermissionsEditView = () => {
  const api = useApi();
  const { getTranslation } = useTranslation();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [selectedNoun, setSelectedNoun] = useState(null);

  const { data: rolesData } = useQuery(['adminPermissionRoles'], () =>
    api.get('admin/permissions/roles'),
  );

  const allRoles = useMemo(() => {
    const roles = rolesData?.roles ?? rolesData?.data?.roles ?? [];
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
    return permData?.permissions ?? permData?.data?.permissions ?? [];
  }, [permData]);

  const objectNames = useMemo(() => {
    return permData?.objectNames ?? permData?.data?.objectNames ?? {};
  }, [permData]);

  const allGroups = useMemo(
    () => buildNounGroups(permissions, selectedRoleIds),
    [permissions, selectedRoleIds],
  );

  const nounOptions = useMemo(() => {
    const objectIdGroupNouns = new Set();
    const childEntries = [];
    for (const perm of permissions) {
      if (perm.objectId) {
        objectIdGroupNouns.add(perm.noun);
        const key = `${perm.noun}#${perm.objectId}`;
        if (!childEntries.some(e => e.key === key)) {
          const displayName = objectNames[key] || perm.objectId;
          childEntries.push({
            key,
            value: `child:${perm.noun}:${perm.objectId}`,
            label: `${perm.noun} — ${displayName}`,
          });
        }
      }
    }
    const groupOptions = [...objectIdGroupNouns]
      .sort()
      .map(noun => ({ value: `objectId:${noun}`, label: `${noun} (objectID)` }));
    const childOptions = childEntries
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(({ value, label }) => ({ value, label }));
    return [...BASE_NOUN_OPTIONS, ...groupOptions, ...childOptions].sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [permissions, objectNames]);

  const filteredGroups = useMemo(() => {
    if (!selectedNoun) return allGroups;
    if (selectedNoun.startsWith('child:')) {
      const [, noun, objectId] = selectedNoun.split(':');
      return allGroups
        .filter(g => g.type === 'objectId' && g.noun === noun)
        .map(g => ({
          ...g,
          data: { ...g.data, children: g.data.children.filter(c => c.objectId === objectId) },
        }))
        .filter(g => g.data.children.length > 0);
    }
    if (selectedNoun.startsWith('objectId:')) {
      const noun = selectedNoun.replace('objectId:', '');
      return allGroups.filter(g => g.type === 'objectId' && g.noun === noun);
    }
    return allGroups.filter(g => g.noun === selectedNoun);
  }, [allGroups, selectedNoun]);

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
      {!isLoading && !error && selectedRoles.length > 0 && filteredGroups.length > 0 && (
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
            {filteredGroups.map(group =>
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
      {!isLoading && !error && selectedRoles.length > 0 && filteredGroups.length === 0 && (
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
