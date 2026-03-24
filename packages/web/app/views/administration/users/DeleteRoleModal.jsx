import { Skeleton, Typography } from '@mui/material';
import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { ERROR_TYPE } from '@tamanu/errors';
import { Button, ButtonRow, Modal } from '@tamanu/ui-components';
import { TranslatedText } from '../../../components';
import { ConfirmRowDivider } from '../../../components/ConfirmRowDivider';
import { useCanDeleteRoleQuery } from './useCanDeleteRoleQuery';
import { useRoleDeleteMutation } from './useRoleDeleteMutation';
import { useRoleQuery } from './useRoleQuery';

const ModalContent = styled.div`
  min-block-size: 8rem;
  display: grid;
  place-items: center stretch;
`;

const StyledButtonRow = styled(ButtonRow)`
  /* Reset style from ButtonRow */
  > :where(button, div, .MuiSkeleton-root):not(:first-child) {
    margin-left: unset;
  }

  flex-direction: row-reverse;
  gap: 20px;
  justify-content: flex-start;
`;

const headingSkeleton = <Skeleton animation="wave" width="16ch" />;
const bodySkeleton = (
  <div>
    <Skeleton animation="wave" width="100%" />
    <Skeleton animation="wave" width="55%" />
  </div>
);
const buttonSkeleton = (
  <Skeleton animation="wave" variant="rounded">
    <Button disabled>
      <TranslatedText stringId="general.action.delete-role" fallback="Delete role" />
    </Button>
  </Skeleton>
);

const roleNameSkeleton = (
  <Skeleton
    animation="wave"
    sx={{ display: 'inline-block', verticalAlign: 'text-bottom' }}
    width="12ch"
  />
);

const getAssignedUserCount = error => {
  const count = Number.parseInt(error?.extra?.get?.('assigned-user-count'), 10);
  return Number.isSafeInteger(count) ? count : null;
};

const getErrorModalTitle = error => {
  const assignedUserCount = getAssignedUserCount(error);
  const isExpectedError = Boolean(assignedUserCount); // We never expect 0 here
  if (!isExpectedError) {
    return (
      <TranslatedText
        stringId="admin.roles.delete.error.generic.presentTense"
        fallback="Cannot delete role"
      />
    );
  }

  return assignedUserCount === 1 ? (
    <TranslatedText
      stringId="admin.roles.delete.error.title.singular"
      fallback="User assigned to role"
    />
  ) : (
    <TranslatedText
      stringId="admin.roles.delete.error.title.plural"
      fallback="Users assigned to role"
    />
  );
};

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

  const {
    error: dryRunError,
    isError: isDryRunError,
    isFetched: isDryRunFetched,
    isLoading: _isDryRunLoading,
  } = useCanDeleteRoleQuery(roleId);

  const isLoadingDeletability = Boolean(roleId) && _isDryRunLoading;
  const isDeleteRestricted = dryRunError?.type === ERROR_TYPE.VALIDATION_CONSTRAINT;
  const showModal = Boolean(roleId) && !isRoleNotFound;

  useEffect(() => {
    if (!roleId || !isDryRunFetched || !isDryRunError || isDeleteRestricted) return;
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
  }, [dismiss, dryRunError, isDeleteRestricted, isDryRunError, isDryRunFetched, roleId]);

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
            stringId="admin.roles.delete.error.generic.pastTense"
            fallback="Couldn’t delete role"
          />
        ),
      );
    },
  });

  useLayoutEffect(() => {
    if (roleId && isRoleNotFound) dismiss();
  }, [roleId, isRoleNotFound, dismiss]);

  const handleConfirm = useCallback(() => {
    if (roleId) deleteRole(roleId);
  }, [deleteRole, roleId]);

  const title = isDeleteRestricted ? (
    getErrorModalTitle(dryRunError)
  ) : (
    <TranslatedText stringId="admin.roles.delete.title" fallback="Delete role" />
  );

  const body = isDeleteRestricted ? (
    <Typography variant="body2">
      <TranslatedText
        stringId="admin.roles.delete.error.usersAssigned"
        fallback="You cannot delete this role as there are currently one or more users assigned to it. Please update the user profiles first in order to delete the role."
      />
    </Typography>
  ) : (
    <Typography variant="body2">
      <TranslatedText
        stringId="admin.roles.delete.confirmation"
        fallback="Are you sure you would like to delete the selected role?"
      />
      &nbsp;&ndash;{' '}
      <strong aria-busy={isRoleLoading}>{isRoleLoading ? roleNameSkeleton : role?.name}</strong>
    </Typography>
  );

  const primaryButton = isDeleteRestricted ? (
    <Button onClick={dismiss}>
      <TranslatedText stringId="general.action.close" fallback="Close" />
    </Button>
  ) : (
    <Button onClick={handleConfirm}>
      <TranslatedText stringId="general.action.delete-role" fallback="Delete role" />
    </Button>
  );

  // Let user dismiss even if pending useCanDeleteRoleQuery result is pending
  const secondaryButton = isDeleteRestricted ? null : (
    <Button onClick={dismiss} variant="outlined">
      <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
    </Button>
  );

  return (
    <Modal
      aria-busy={isLoadingDeletability}
      open={showModal}
      onClose={dismiss}
      title={isLoadingDeletability ? headingSkeleton : title}
    >
      <ModalContent>{isLoadingDeletability ? bodySkeleton : body}</ModalContent>
      <ConfirmRowDivider />
      <StyledButtonRow>
        {isLoadingDeletability ? buttonSkeleton : primaryButton}
        {secondaryButton}
      </StyledButtonRow>
    </Modal>
  );
};
