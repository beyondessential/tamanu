import { Skeleton, Typography } from '@mui/material';
import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { ERROR_TYPE } from '@tamanu/errors';
import { Button, ButtonRow, Modal } from '@tamanu/ui-components';
import { TranslatedText } from '../../../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ConfirmRowDivider } from '../../../components/ConfirmRowDivider';
import { useCanDeleteRoleQuery } from './useCanDeleteRoleQuery';
import { useRoleDeleteMutation } from './useRoleDeleteMutation';
import { useRoleQuery } from './useRoleQuery';

const ModalContent = styled.div`
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

const RoleDeleteErrorModal = ({ open, error, onClose }) => {
  if (!Error.isError(error)) return null;

  const _assignedUserCount = Number.parseInt(error?.extra?.get?.('assigned-user-count'), 10);
  const assignedUserCount = Number.isSafeInteger(_assignedUserCount) ? _assignedUserCount : null;

  const isExpectedError = assignedUserCount != null && assignedUserCount > 0;
  if (!isExpectedError) {
    toast.error(
      error?.detail || error?.message || (
        <TranslatedText
          stringId="admin.roles.delete.error.generic"
          fallback="Couldn’t delete role"
        />
      ),
    );
    return null;
  }

  const isSingular = assignedUserCount === 1;
  const title = isSingular ? (
    <TranslatedText
      stringId="admin.roles.delete.error.title.singular"
      fallback="User assigned to role"
      casing="sentence"
    />
  ) : (
    <TranslatedText
      stringId="admin.roles.delete.error.title.plural"
      fallback="Users assigned to role"
      casing="sentence"
    />
  );

  const body = (
    <TranslatedText
      stringId="admin.roles.delete.error.assignedUsers"
      fallback="You cannot delete this role as there is currently one or more users assigned to it. Please update the user profile first in order to delete the role."
    />
  );

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <ModalContent>
        <Typography variant="body2">{body}</Typography>
      </ModalContent>
      <ConfirmRowDivider />
      <ButtonRow>
        <Button onClick={onClose}>
          <TranslatedText stringId="general.action.close" fallback="Close" />
        </Button>
      </ButtonRow>
    </Modal>
  );
};

export const DeleteRoleModal = ({ onSuccess }) => {
  const deleteMatch = useMatch('/admin/users/roles/delete/:id');
  const roleId = deleteMatch?.params.id;
  const {
    data: role,
    error: roleQueryError,
    isLoading: isRoleLoading,
    isFetched: isRoleFetched,
  } = useRoleQuery(roleId);
  const isRoleNotFound = roleQueryError?.status === 404;

  const navigate = useNavigate();
  const dismiss = useCallback(
    () => navigate({ pathname: '..', search: window.location.search }),
    [navigate],
  );

  const {
    error: dryRunError,
    isError: isDryRunError,
    isFetched: isDryRunFetched,
    isLoading: isDryRunLoading,
    isSuccess: isDryRunSuccess,
  } = useCanDeleteRoleQuery(roleId);

  const isDryRunConstraintError =
    isDryRunError && dryRunError?.type === ERROR_TYPE.VALIDATION_CONSTRAINT;

  const showDeleteErrorModal = Boolean(roleId) && isDryRunConstraintError;

  const showConfirmModal =
    Boolean(roleId) &&
    !isRoleNotFound &&
    !showDeleteErrorModal &&
    (isRoleLoading || isDryRunLoading || isDryRunSuccess);

  const confirmDisabled = isRoleLoading || isDryRunLoading;

  useEffect(() => {
    if (!roleId || !isDryRunFetched || !isDryRunError || isDryRunConstraintError) return;
    // Not found is surfaced by `useRoleQuery`; dismiss runs in `useLayoutEffect` when that settles.
    if (dryRunError?.status === 404 || dryRunError?.type === ERROR_TYPE.NOT_FOUND) return;

    toast.error(
      dryRunError?.detail || dryRunError?.message || (
        <TranslatedText
          stringId="admin.roles.delete.error.generic"
          fallback="Couldn’t delete role"
        />
      ),
    );
    dismiss();
  }, [dismiss, dryRunError, isDryRunConstraintError, isDryRunError, isDryRunFetched, roleId]);

  const { mutate: deleteRole } = useRoleDeleteMutation({
    onSuccess: () => {
      dismiss();
      toast.success(
        <>
          <TranslatedText stringId="admin.roles.delete.success" fallback="Deleted role" />{' '}
          <q>{role?.name}</q>
        </>,
      );
      onSuccess?.();
    },
    onError: error => {
      toast.error(
        error.detail || error.message || (
          <TranslatedText
            stringId="admin.roles.delete.error.generic"
            fallback="Couldn’t delete role"
          />
        ),
      );
    },
  });

  useLayoutEffect(() => {
    if (roleId && isRoleFetched && isRoleNotFound) dismiss();
  }, [roleId, isRoleFetched, isRoleNotFound, dismiss]);

  const onClose = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleConfirm = useCallback(() => {
    if (roleId) deleteRole(roleId);
  }, [deleteRole, roleId]);

  return (
    <>
      <ConfirmModal
        aria-busy={confirmDisabled}
        confirmButtonText={
          <TranslatedText stringId="general.action.delete-role" fallback="Delete role" />
        }
        confirmButtonProps={{ disabled: confirmDisabled }}
        title={<TranslatedText stringId="admin.roles.delete.title" fallback="Delete role" />}
        customContent={
          <ModalContent>
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
          </ModalContent>
        }
        open={showConfirmModal}
        onCancel={onClose}
        onConfirm={handleConfirm}
      />
      <RoleDeleteErrorModal open={showDeleteErrorModal} error={dryRunError} onClose={onClose} />
    </>
  );
};
