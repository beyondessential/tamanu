import { Typography } from '@mui/material';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useMatch, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { PlusIcon } from '../../../assets/icons/PlusIcon';
import { Button, DataFetchingTable, TranslatedText } from '../../../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { Colors } from '../../../constants';
import { ROLES_ENDPOINT } from '../constants';
import { AddRoleModal } from './AddRoleModal';
import { Article } from './RolesAndDesignationsAdminView';
import { RolesSearchForm } from './RolesSearchForm';
import { useRoleDeleteMutation } from './useRoleDeleteMutation';
import { useRoleQuery } from './useRoleQuery';

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

  /* Fit to meatball menu button width; let browser distribute remaining columns */
  th:last-of-type,
  td:last-of-type {
    inline-size: 0;
  }
`;

const STATIC_COLUMNS = /** @type {const} */ ([
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
]);

const DeleteConfirmationModal = ({ roleName, ...confirmModalProps }) => (
  <ConfirmModal
    confirmButtonText={
      <TranslatedText stringId="general.action.delete-role" fallback="Delete role" />
    }
    title={<TranslatedText stringId="admin.roles.delete.title" fallback="Delete role" />}
    customContent={
      <DeleteConfirmationModalContent>
        <Typography variant="body2">
          <TranslatedText
            stringId="admin.roles.delete.confirmation"
            fallback="Are you sure you would like to delete the selected role?"
          />
          &nbsp;&ndash; <strong>{roleName}</strong>
        </Typography>
      </DeleteConfirmationModalContent>
    }
    {...confirmModalProps}
  />
);

const DeleteConfirmationModalContent = styled.div`
  min-block-size: 8rem;
  display: grid;
  place-items: center stretch;
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

export const RolesAdminView = () => {
  // Search state
  const [searchParams] = useSearchParams();
  const nameQuery = searchParams.get('name') ?? undefined;
  const idQuery = searchParams.get('id') ?? undefined;

  // DataFetchingTable state
  const [refreshCount, setRefreshCount] = useState(0);

  // ‘Add role’ and ‘Delete role’ modal routes
  const isAddRoute = Boolean(useMatch('/admin/users/roles/new'));
  const deleteMatch = useMatch('/admin/users/roles/delete/:id');
  const deleteRoleId = deleteMatch?.params.id;
  const navigate = useNavigate();

  const { data: roleForDelete, error: roleQueryError } = useRoleQuery(deleteRoleId);
  const isRoleNotFound = roleQueryError?.status === 404;

  useLayoutEffect(() => {
    if (deleteRoleId && isRoleNotFound) {
      navigate({ pathname: '..', search: window.location.search });
    }
  }, [deleteRoleId, isRoleNotFound, navigate]);

  const { mutate: deleteRole } = useRoleDeleteMutation({
    onSuccess: () => {
      // Imperatively refetch because DataFetchingTable isn’t built on useQuery
      setRefreshCount(c => c + 1);
      navigate({ pathname: '..', search: window.location.search });
      toast.success(
        <TranslatedText stringId="admin.roles.delete.success" fallback="Role deleted" />,
      );
    },
    onError: error => {
      toast.error(
        error.detail || error.message || (
          <TranslatedText stringId="admin.roles.delete.error" fallback="Couldn’t delete role" />
        ),
      );
    },
  });

  const columns = useMemo(
    () =>
      /** @type {const} */ ([
        ...STATIC_COLUMNS,
        {
          key: 'actions',
          title: '',
          sortable: false,
          numeric: true, // Not really, but applies align="right" to MUI TableCell
          dontCallRowInput: true,
          CellComponent: ActionMenu,
        },
      ]),
    [],
  );

  const closeDeleteModal = useCallback(() => {
    navigate({ pathname: '..', search: window.location.search });
  }, [navigate]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteRoleId) deleteRole(deleteRoleId);
  }, [deleteRole, deleteRoleId]);

  return (
    <Article>
      <Header>
        <RolesSearchForm />
        <AddButton onClick={() => navigate({ pathname: 'new', search: window.location.search })}>
          {plusIcon}
          <TranslatedText stringId="general.action.add-role" fallback="Add role" />
        </AddButton>
      </Header>
      <StyledDataFetchingTable
        allowExport={false}
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
        onClose={() => navigate({ pathname: '..', search: window.location.search })}
        onSuccess={() => setRefreshCount(c => c + 1)}
      />

      <DeleteConfirmationModal
        open={Boolean(deleteRoleId) && !isRoleNotFound}
        onCancel={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        roleName={roleForDelete?.name}
      />
    </Article>
  );
};
