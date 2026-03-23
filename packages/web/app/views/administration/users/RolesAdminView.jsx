import React, { useCallback, useState } from 'react';
import { useMatch, useNavigate, useSearchParams } from 'react-router';
import styled from 'styled-components';

import { PlusIcon } from '../../../assets/icons/PlusIcon';
import { Button, DataFetchingTable, TranslatedText } from '../../../components';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { Colors } from '../../../constants';
import { ROLES_ENDPOINT } from '../constants';
import { AddRoleModal } from './AddRoleModal';
import { DeleteRoleModal } from './DeleteRoleModal';
import { Article } from './RolesAndDesignationsAdminView';
import { RolesSearchForm } from './RolesSearchForm';

const Header = styled.header`
  align-items: flex-end;
  background-color: ${Colors.white};
  border-block-start: 1px solid ${Colors.outline};
  border-inline: 1px solid ${Colors.outline};
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  display: grid;
  gap: 0.625rem;
  grid-template-columns: auto minmax(min-content, max-content);
  padding-block: 0.625rem;
  padding-inline: 1.25rem;
`;

const AddButton = styled(Button)`
  align-self: flex-end;
`;

const plusIcon = (
  <PlusIcon
    aria-hidden
    width={18}
    height={18}
    style={{ color: 'oklch(from currentColor l c h / 96%)', marginInlineEnd: '0.5em' }}
  />
);

const StyledDataFetchingTable = styled(DataFetchingTable)`
  border-start-end-radius: 0;
  border-start-start-radius: 0;
  box-shadow: unset;
  tbody tr:hover {
    background-color: ${Colors.veryLightBlue};
  }
`;

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
  const isAddRoute = Boolean(useMatch('/admin/users/roles/new'));

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
