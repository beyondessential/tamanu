import { Typography } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { TranslatedText } from '../../../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ThreeDotMenu } from '../../../components/ThreeDotMenu';
import { DESIGNATIONS_ENDPOINT } from '../constants';
import {
  AddButton,
  Article,
  Header,
  plusIcon,
  StyledDataFetchingTable,
} from './RolesAndDesignationsAdminView';
import { DesignationsSearchForm } from './DesignationsSearchForm';
import { useDesignationDeleteMutation } from './useDesignationDeleteMutation';

const STATIC_COLUMNS = /** @type {const} */ ([
  {
    key: 'user.displayName',
    title: <TranslatedText stringId="admin.designations.name.column" fallback="Name" />,
    sortable: true,
  },
  {
    key: 'designationId',
    title: <TranslatedText stringId="admin.designations.id.column" fallback="ID" />,
    sortable: true,
  },
]);

const DeleteConfirmationModal = styled(ConfirmModal).attrs({
  confirmButtonText: (
    <TranslatedText stringId="general.action.delete-designation" fallback="Delete designation" />
  ),
  title: (
    <TranslatedText stringId="admin.designations.delete.title" fallback="Delete designation" />
  ),
})``;

const DeleteConfirmationModalContent = styled(Typography).attrs({
  variant: 'body2',
})`
  min-block-size: 8rem;
  display: grid;
  place-items: center stretch;
`;

export const DesignationsAdminView = () => {
  const [searchParams] = useSearchParams();
  const idQuery = searchParams.get('id');
  const nameQuery = searchParams.get('name');

  const navigate = useNavigate();
  const [designationToDelete, setDesignationToDelete] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const { mutate: deleteDesignation } = useDesignationDeleteMutation({
    onSuccess: () => {
      setRefreshCount(c => c + 1);
      setDesignationToDelete(null);
      toast.success(
        <TranslatedText
          stringId="admin.designations.delete.success"
          fallback="Designation deleted"
        />,
      );
    },
    onError: error => {
      toast.error(
        error.message ?? (
          <TranslatedText
            stringId="admin.designations.delete.error"
            fallback="Couldn’t delete designation"
          />
        ),
      );
    },
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
                onClick: () => setDesignationToDelete(data),
              },
            ]}
          />
        ),
      },
    ],
    [],
  );

  const handleConfirmDelete = useCallback(() => {
    if (designationToDelete) deleteDesignation(designationToDelete.designationId);
  }, [deleteDesignation, designationToDelete]);

  return (
    <Article>
      <Header>
        <DesignationsSearchForm />
        <AddButton onClick={() => navigate('new')}>
          {plusIcon}
          <TranslatedText stringId="general.action.add-designation" fallback="Add designation" />
        </AddButton>
      </Header>
      <StyledDataFetchingTable
        allowExport={true}
        columns={columns}
        defaultRowsPerPage={10}
        endpoint={DESIGNATIONS_ENDPOINT}
        fetchOptions={{
          designationId: idQuery,
          display_name: nameQuery,
        }}
        initialSort={{ orderBy: 'user.displayName', order: 'asc' }}
        noDataMessage={
          <TranslatedText
            stringId="admin.designations.noData.message"
            fallback="No designations found"
          />
        }
        refreshCount={refreshCount}
      />

      <DeleteConfirmationModal
        open={Boolean(designationToDelete)}
        onCancel={() => setDesignationToDelete(null)}
        onConfirm={handleConfirmDelete}
        customContent={
          <DeleteConfirmationModalContent>
            <TranslatedText
              stringId="admin.designations.delete.confirmation"
              fallback="Are you sure you would like to delete this designation?"
            />
          </DeleteConfirmationModalContent>
        }
      />
    </Article>
  );
};
