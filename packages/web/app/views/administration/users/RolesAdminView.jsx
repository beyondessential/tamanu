import React, { useCallback, useState } from 'react';
import { useMatch, useNavigate, useSearchParams } from 'react-router';

import { TranslatedText } from '../../../components';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { ROLES_ENDPOINT } from '../constants';
import { AddRoleModal } from './AddRoleModal';
import { DeleteRoleModal } from './DeleteRoleModal';
import {
  AddButton,
  Article,
  Header,
  plusIcon,
  StyledDataFetchingTable,
} from './RolesAndDesignationsAdminView';
import { RolesSearchForm } from './RolesSearchForm';

const ActionMenu = ({ data }) => {
  const navigate = useNavigate();

  return (
    <ThreeDotMenu
      items={[
        {
          label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
          onClick: () =>
            navigate({
              pathname: `delete/${encodeURIComponent(data.id)}`,
              search: window.location.search,
            }),
        },
      ]}
    />
  );
};

const columns = /** @type {const} */ ([
  {
    key: 'name',
    sortable: true,
    title: <TranslatedText stringId="admin.roles.name.column" fallback="Name" />,
  },
  {
    key: 'id',
    sortable: true,
    title: <TranslatedText stringId="admin.roles.id.column" fallback="ID" />,
  },
  {
    CellComponent: ActionMenu,
    dontCallRowInput: true,
    isExportable: false,
    key: 'actions',
    numeric: true, // Not really, but applies align="right" to MUI TableCell
    sortable: false,
    title: '',
  },
]);

export const RolesAdminView = () => {
  // Search state
  const [searchParams] = useSearchParams();
  const nameQuery = searchParams.get('name') ?? undefined;
  const idQuery = searchParams.get('id') ?? undefined;

  // DataFetchingTable state
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshDataTable = useCallback(() => setRefreshCount(c => c + 1), []);

  // ‘Add role’ modal route
  const navigate = useNavigate();
  const openAddRoleModal = useCallback(
    () => navigate({ pathname: 'new', search: window.location.search }),
    [navigate],
  );
  const closeAddRoleModal = useCallback(
    () => navigate({ pathname: '..', search: window.location.search }),
    [navigate],
  );
  const isAddRoute = Boolean(useMatch('/admin/users/rolesAndDesignations/roles/new'));

  return (
    <Article>
      <Header>
        <RolesSearchForm />
        <AddButton onClick={openAddRoleModal}>
          {plusIcon}
          <TranslatedText stringId="general.action.add-role" fallback="Add role" />
        </AddButton>
      </Header>
      <StyledDataFetchingTable
        columns={columns}
        endpoint={ROLES_ENDPOINT}
        fetchOptions={{ id: idQuery, name: nameQuery }}
        initialSort={{ orderBy: 'name', order: 'asc' }}
        noDataMessage={
          <TranslatedText stringId="admin.roles.noData.message" fallback="No roles found" />
        }
        refreshCount={refreshCount}
      />

      <AddRoleModal
        open={isAddRoute}
        onClose={closeAddRoleModal}
        onSuccess={() => setRefreshCount(c => c + 1)}
      />

      <DeleteRoleModal onSuccess={refreshDataTable} />
    </Article>
  );
};
