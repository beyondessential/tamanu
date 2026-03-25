import { Skeleton, Typography } from '@mui/material';
import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { ERROR_TYPE } from '@tamanu/errors';
import { Button as UiButton, Button, ButtonRow, Modal } from '@tamanu/ui-components';
import { TranslatedText } from '../../../../components';
import { ConfirmRowDivider } from '../../../../components/ConfirmRowDivider';
import {
  deleteModalBodySkeleton,
  deleteModalHeadingSkeleton,
  shortInlineSkeleton,
} from '../components';
import { useCanDeleteDesignationQuery } from '../useCanDeleteDesignationQuery';
import { useDesignationDeleteMutation } from './useDesignationDeleteMutation';
import { useDesignationQuery } from './useDesignationQuery';

const primaryButtonSkeleton = (
  <Skeleton animation="wave" variant="rounded">
    <UiButton disabled>
      <TranslatedText stringId="general.action.delete-designation" fallback="Delete designation" />
    </UiButton>
  </Skeleton>
);

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

const getAssignedTaskCount = error => {
  const count = Number.parseInt(error?.extra?.get?.('assigned-task-count'), 10);
  return Number.isSafeInteger(count) ? count : null;
};

const getAssignedUserCount = error => {
  const count = Number.parseInt(error?.extra?.get?.('assigned-user-count'), 10);
  return Number.isSafeInteger(count) ? count : null;
};

const getErrorModalTitle = error => {
  const assignedUserCount = getAssignedUserCount(error);
  const assignedTaskCount = getAssignedTaskCount(error);
  const hasUsers = Boolean(assignedUserCount);
  const hasTasks = Boolean(assignedTaskCount);

  if (hasUsers && !hasTasks) {
    return assignedUserCount === 1 ? (
      <TranslatedText
        stringId="admin.designations.delete.error.title.singular"
        fallback="User assigned to designation"
      />
    ) : (
      <TranslatedText
        stringId="admin.designations.delete.error.title.plural"
        fallback="Users assigned to designation"
      />
    );
  }

  if (hasTasks && !hasUsers) {
    return assignedTaskCount === 1 ? (
      <TranslatedText
        stringId="admin.designations.delete.error.title.taskSingular"
        fallback="Task assigned to designation"
      />
    ) : (
      <TranslatedText
        stringId="admin.designations.delete.error.title.taskPlural"
        fallback="Tasks assigned to designation"
      />
    );
  }

  if (hasUsers && hasTasks) {
    return (
      <TranslatedText
        stringId="admin.designations.delete.error.title.blocked"
        fallback="Cannot delete designation"
      />
    );
  }

  return (
    <TranslatedText
      stringId="admin.designations.delete.error.generic.presentTense"
      fallback="Cannot delete designation"
    />
  );
};

const getErrorModalBody = error => {
  const assignedUserCount = getAssignedUserCount(error);
  const assignedTaskCount = getAssignedTaskCount(error);
  const hasUsers = Boolean(assignedUserCount);
  const hasTasks = Boolean(assignedTaskCount);

  if (hasUsers && !hasTasks) {
    return (
      <Typography variant="body2">
        <TranslatedText
          stringId="admin.designations.delete.error.usersAssigned"
          fallback="You cannot delete this designation as there are currently one or more users assigned to it. Please update the user profiles first in order to delete the designation."
        />
      </Typography>
    );
  }

  if (hasTasks && !hasUsers) {
    return (
      <Typography variant="body2">
        <TranslatedText
          stringId="admin.designations.delete.error.tasksAssigned"
          fallback="You cannot delete this designation as there are currently one or more tasks assigned to it. Please reassign or remove those tasks first."
        />
      </Typography>
    );
  }

  return (
    <Typography variant="body2">
      <TranslatedText
        stringId="admin.designations.delete.error.tasksAndUsersAssigned"
        fallback="You cannot delete this designation while tasks or users are still assigned to it. Please remove those assignments first."
      />
    </Typography>
  );
};

export const DeleteDesignationModal = ({ onSuccess }) => {
  const deleteMatch = useMatch('/admin/users/rolesAndDesignations/designations/delete/:id');
  const designationId = deleteMatch?.params.id;
  const {
    data: designation,
    error: designationQueryError,
    isLoading: isDesignationLoading,
  } = useDesignationQuery(designationId);
  const isDesignationNotFound = designationQueryError?.status === 404;

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
  } = useCanDeleteDesignationQuery(designationId);

  const isLoadingDeletability = Boolean(designationId) && _isDryRunLoading;
  const isDeleteRestricted = dryRunError?.type === ERROR_TYPE.VALIDATION_CONSTRAINT;
  const showModal = Boolean(designationId) && !isDesignationNotFound;

  useEffect(() => {
    if (!designationId || !isDryRunFetched || !isDryRunError || isDeleteRestricted) return;
    if (dryRunError?.status === 404 || dryRunError?.type === ERROR_TYPE.NOT_FOUND) return;

    toast.error(
      dryRunError?.detail || dryRunError?.message || (
        <TranslatedText
          stringId="admin.designations.delete.error.generic"
          fallback="Couldn’t delete designation"
        />
      ),
    );
    dismiss();
  }, [dismiss, dryRunError, isDeleteRestricted, isDryRunError, isDryRunFetched, designationId]);

  const { mutate: deleteDesignation } = useDesignationDeleteMutation({
    onSettled: () => dismiss(),
    onSuccess: () => {
      toast.success(
        <TranslatedText
          stringId="admin.designations.delete.success"
          fallback="Designation deleted"
        />,
      );
      onSuccess?.();
    },
    onError: error => {
      toast.error(
        error.detail || error.message || (
          <TranslatedText
            stringId="admin.designations.delete.error.generic.pastTense"
            fallback="Couldn’t delete designation"
          />
        ),
      );
    },
  });

  useLayoutEffect(() => {
    if (designationId && isDesignationNotFound) dismiss();
  }, [designationId, isDesignationNotFound, dismiss]);

  const handleConfirm = useCallback(() => {
    if (designationId) deleteDesignation(designationId);
  }, [deleteDesignation, designationId]);

  const title = isDeleteRestricted ? (
    getErrorModalTitle(dryRunError)
  ) : (
    <TranslatedText stringId="admin.designations.delete.title" fallback="Delete designation" />
  );

  const body = isDeleteRestricted ? (
    getErrorModalBody(dryRunError)
  ) : (
    <Typography variant="body2">
      <TranslatedText
        stringId="admin.designations.delete.confirmation"
        fallback="Are you sure you would like to delete this designation?"
      />
      &nbsp;&ndash;{' '}
      <strong aria-busy={isDesignationLoading}>
        {isDesignationLoading ? shortInlineSkeleton : designation?.name}
      </strong>
    </Typography>
  );

  const primaryButton = isDeleteRestricted ? (
    <Button onClick={dismiss}>
      <TranslatedText stringId="general.action.close" fallback="Close" />
    </Button>
  ) : (
    <Button onClick={handleConfirm}>
      <TranslatedText stringId="general.action.delete-designation" fallback="Delete designation" />
    </Button>
  );

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
      title={isLoadingDeletability ? deleteModalHeadingSkeleton : title}
    >
      <ModalContent>{isLoadingDeletability ? deleteModalBodySkeleton : body}</ModalContent>
      <ConfirmRowDivider />
      <StyledButtonRow>
        {isLoadingDeletability ? primaryButtonSkeleton : primaryButton}
        {secondaryButton}
      </StyledButtonRow>
    </Modal>
  );
};
