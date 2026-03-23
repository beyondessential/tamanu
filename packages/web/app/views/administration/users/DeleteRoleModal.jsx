import { Skeleton, Typography } from '@mui/material';
import React, { useCallback, useLayoutEffect } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { TranslatedText } from '../../../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { useRoleDeleteMutation } from './useRoleDeleteMutation';
import { useRoleQuery } from './useRoleQuery';

const DeleteRoleModalContent = styled.div`
  min-block-size: 8rem;
  display: grid;
  place-items: center stretch;
`;

const roleNameSkeleton = (
  <Skeleton
    animation="wave"
    sx={{ display: 'inline-block', verticalAlign: 'text-bottom' }}
    width="12ch"
  />
);

export const DeleteRoleModal = ({ onSuccess }) => {
  const deleteMatch = useMatch('/admin/users/roles/delete/:id');
  const roleId = deleteMatch?.params.id;
  const { data: role, error: roleQueryError, isLoading: isRoleLoading } = useRoleQuery(roleId);
  const isRoleNotFound = roleQueryError?.status === 404;

  const navigate = useNavigate();
  const dismiss = useCallback(
    () => navigate({ pathname: '..', search: window.location.search }),
    [navigate],
  );

  const { mutate: deleteRole } = useRoleDeleteMutation({
    onSuccess: () => {
      onSuccess?.();
      dismiss();
      toast.success(
        <TranslatedText
          stringId="admin.roles.delete.success"
          fallback="Deleted role ‘:roleName’"
          replacements={{ roleName: role?.name }}
        />,
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

  useLayoutEffect(() => {
    if (roleId && isRoleNotFound) dismiss();
  }, [roleId, isRoleNotFound, dismiss]);

  const handleCancel = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleConfirm = useCallback(() => {
    if (roleId) deleteRole(roleId);
  }, [deleteRole, roleId]);

  return (
    <ConfirmModal
      confirmButtonText={
        <TranslatedText stringId="general.action.delete-role" fallback="Delete role" />
      }
      title={<TranslatedText stringId="admin.roles.delete.title" fallback="Delete role" />}
      customContent={
        <DeleteRoleModalContent>
          <Typography variant="body2">
            <TranslatedText
              stringId="admin.roles.delete.confirmation"
              fallback="Are you sure you would like to delete the selected role?"
            />
            &nbsp;&ndash;{' '}
            <strong aria-busy={isRoleLoading}>
              {isRoleLoading ? roleNameSkeleton : role?.name}
            </strong>
          </Typography>
        </DeleteRoleModalContent>
      }
      open={Boolean(roleId) && !isRoleNotFound}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );
};
