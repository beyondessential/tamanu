import { Typography } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormSubmitButton, TextButton, TextField } from '@tamanu/ui-components';
import { useSuggester } from '../../../api';
import { PlusIcon } from '../../../assets/icons/PlusIcon';
import { Button, DataFetchingTable, TranslatedText } from '../../../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { AutocompleteField, Field } from '../../../components/Field';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { Colors } from '../../../constants';
import { ROLES_ENDPOINT } from '../constants';
import { Article } from './RolesAndDesignationsAdminView';
import { useRoleDeleteMutation } from './useRoleDeleteMutation';

const Header = styled.header`
  align-items: flex-end;
  background-color: ${Colors.white};
  border-block-start: 1px solid ${Colors.outline};
  border-inline: 1px solid ${Colors.outline};
  border-start-end-radius: 0.3125rem;
  border-start-start-radius: 0.3125rem;
  display: grid;
  gap: 0.625rem;
  padding-block: 0.625rem;
  padding-inline: 1.25rem;
  grid-template-columns: auto minmax(min-content, max-content);
`;

const Search = styled('search')`
  display: contents;
  gap: inherit;
`;

const StyledForm = styled(Form)`
  display: grid;
  gap: inherit;
  grid-template-columns: repeat(auto-fill, minmax(min(19.375rem, 100%), 1fr));
`;

const StyledField = styled(Field).attrs({
  placeholder: 'Search…',
  size: 'small',
})``;

const ButtonGroup = styled.div`
  align-items: flex-end;
  display: flex;
  font-size: 0.875rem;
  gap: inherit;
  button {
    font-size: inherit;
  }
`;

const AddButton = styled(Button)`
  align-self: flex-end;
`;

const plusIcon = (
  <PlusIcon
    aria-hidden
    width={18}
    height={18}
    style={{ color: 'oklch(from currentColor l c h / 96%', marginInlineEnd: '0.5em' }}
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
    title: <TranslatedText stringId="admin.roles.name.column" fallback="Name" />,
    sortable: true,
  },
  {
    key: 'id',
    title: <TranslatedText stringId="admin.roles.id.column" fallback="ID" />,
    sortable: true,
  },
]);

const DeleteConfirmationModal = styled(ConfirmModal).attrs({
  confirmButtonText: (
    <TranslatedText stringId="general.action.delete-role" fallback="Delete role" />
  ),
  'data-testid': 'confirm-modal-delete-role',
  title: (
    <TranslatedText
      stringId="admin.roles.delete.title"
      fallback="Delete role"
      data-testid="translatedtext-delete-role-title"
    />
  ),
})``;

const DeleteConfirmationModalContent = styled(Typography).attrs({
  variant: 'body2',
})`
  min-block-size: 8rem;
  display: grid;
  place-items: center stretch;
`;

export const RolesAdminView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const nameFromUrl = searchParams.get('name') ?? '';
  const idFromUrl = searchParams.get('id') ?? '';

  const { mutate: deleteRole } = useRoleDeleteMutation({
    onSuccess: () => {
      // Imperatively refetch because DataFetchingTable isn’t built on useQuery
      setRefreshCount(c => c + 1);
      setRoleToDelete(null);
      toast.success(
        <TranslatedText stringId="admin.roles.delete.success" fallback="Role deleted" />,
      );
    },
    onError: error => {
      toast.error(
        error.message ?? (
          <TranslatedText stringId="admin.roles.delete.error" fallback="Couldn’t delete role" />
        ),
      );
    },
  });

  const roleSuggester = useSuggester('role', {
    formatter: ({ id }) => ({ label: id, value: id }),
  });

  const columns = useMemo(
    () => [
      ...STATIC_COLUMNS,
      {
        key: 'actions',
        title: '',
        sortable: false,
        dontCallRowInput: true,
        CellComponent: ({ data }) => (
          <ThreeDotMenu
            items={[
              {
                label: <TranslatedText stringId="general.action.delete" fallback="Delete" />,
                onClick: () => setRoleToDelete(data),
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  const handleConfirmDelete = useCallback(() => {
    if (roleToDelete) deleteRole(roleToDelete.id);
  }, [deleteRole, roleToDelete]);

  const onSubmit = values => {
    const name = values.name?.trim();
    const id = values.id?.trim();
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);

        if (id) next.set('id', id);
        else next.delete('id');

        if (name) next.set('name', name);
        else next.delete('name');

        return next;
      },
      { replace: true },
    );
  };

  const onClear = () => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        next.delete('id');
        next.delete('name');
        return next;
      },
      { replace: true },
    );
  };

  return (
    <Article>
      <Header>
        <Search>
          <StyledForm
            formType={FORM_TYPES.SEARCH_FORM}
            initialValues={{ id: idFromUrl, name: nameFromUrl }}
            key={`id=${idFromUrl}&name=${nameFromUrl}`}
            onSubmit={onSubmit}
            render={({ submitForm }) => (
              <>
                <StyledField
                  component={TextField}
                  inputProps={{ 'data-testid': 'roles-search-name-input' }}
                  label={<TranslatedText stringId="admin.roles.name.label" fallback="Name" />}
                  name="name"
                />
                <StyledField
                  component={AutocompleteField}
                  data-testid="roles-search-id"
                  label={<TranslatedText stringId="admin.roles.id.label" fallback="ID" />}
                  name="id"
                  suggester={roleSuggester}
                />
                <ButtonGroup>
                  <FormSubmitButton
                    color="primary"
                    data-testid="roles-search-button"
                    onClick={submitForm}
                  >
                    <TranslatedText stringId="general.action.search" fallback="Search" />
                  </FormSubmitButton>
                  <Button data-testid="roles-clear-button" onClick={onClear} variant="text">
                    <TranslatedText stringId="general.action.clear" fallback="Clear" />
                  </Button>
                </ButtonGroup>
              </>
            )}
          />
        </Search>
        <AddButton color="primary" data-testid="roles-add-role-button">
          {plusIcon}
          <TranslatedText stringId="general.action.add-role" fallback="Add role" />
        </AddButton>
      </Header>
      <StyledDataFetchingTable
        allowExport={false}
        columns={columns}
        data-testid="roles-table"
        defaultRowsPerPage={10}
        endpoint={ROLES_ENDPOINT}
        fetchOptions={{ id: idFromUrl, name: nameFromUrl }}
        initialSort={{ orderBy: 'name', order: 'asc' }}
        noDataMessage={
          <TranslatedText stringId="admin.roles.noData.message" fallback="No roles found" />
        }
        refreshCount={refreshCount}
      />

      <DeleteConfirmationModal
        open={Boolean(roleToDelete)}
        onCancel={() => setRoleToDelete(null)}
        onConfirm={handleConfirmDelete}
        customContent={
          <DeleteConfirmationModalContent>
            <TranslatedText
              stringId="admin.roles.delete.confirmation"
              fallback="Are you sure you would like to delete this role?"
              data-testid="translatedtext-delete-role-text"
            />
          </DeleteConfirmationModalContent>
        }
      />
    </Article>
  );
};
