import { Skeleton, Typography } from '@mui/material';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { ERROR_TYPE } from '@tamanu/errors';
import { Button, ButtonRow, Modal } from '@tamanu/ui-components';
import { TranslatedText } from '../../../components';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { ConfirmRowDivider } from '../../../components/ConfirmRowDivider';
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
  const roleId = error?.extra?.get?.('role-id');
  const assignedUserCount = error?.extra?.get?.('assigned-user-count');
  const isExpectedError = Boolean(roleId && assignedUserCount);

  const isSingular = assignedUserCount === 1;
  const userNoun = isSingular ? (
    <TranslatedText stringId="general.noun.user.singular" fallback="user" />
  ) : (
    <TranslatedText stringId="general.noun.user.plural" fallback="users" />
  );
  const profileNoun = isSingular ? (
    <TranslatedText stringId="general.noun.profile.singular" fallback="profile" />
  ) : (
    <TranslatedText stringId="general.noun.profile.plural" fallback="profiles" />
  );
  const verb = isSingular ? (
    <TranslatedText stringId="general.verb.toBe.present.thirdPerson.singular" fallback="is" />
  ) : (
    <TranslatedText stringId="general.verb.toBe.present.thirdPerson.plural" fallback="are" />
  );

  const title = isExpectedError && (
    <TranslatedText
      stringId="admin.roles.delete.error.title"
      fallback=":userNoun assigned to role"
      replacements={{ userNoun }}
      casing="sentence"
    />
  );
  const detail = isExpectedError && (
    <TranslatedText
      stringId="admin.roles.delete.error.detail"
      fallback="Cannot delete role with ID ‘:roleId’ as :count :userNoun :verb assigned to it. Please update their :profileNoun first in order to delete the role."
      replacements={{
        roleId,
        count: assignedUserCount.toLocaleString(),
        userNoun,
        verb,
        profileNoun,
      }}
    />
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      width="sm"
      title={
        title ||
        error?.title || (
          <TranslatedText
            stringId="admin.roles.delete.error.generic"
            fallback="Couldn’t delete role"
          />
        )
      }
    >
      <ModalContent>
        <Typography variant="body2">
          {detail || error?.detail || error?.message || (
            <TranslatedText
              stringId="admin.roles.delete.error.generic"
              fallback="Couldn’t delete role"
            />
          )}
        </Typography>
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
  const { data: role, error: roleQueryError, isLoading: isRoleLoading } = useRoleQuery(roleId);
  const isRoleNotFound = roleQueryError?.status === 404;

  const navigate = useNavigate();
  const dismiss = useCallback(
    () => navigate({ pathname: '..', search: window.location.search }),
    [navigate],
  );

  const [deleteRoleError, setDeleteRoleError] = useState(null);

  const { mutate: deleteRole } = useRoleDeleteMutation({
    onSuccess: () => {
      setDeleteRoleError(null);
      dismiss();
      toast.success(
        <>
          <TranslatedText stringId="admin.roles.delete.success" fallback="Deleted role" />{' '}
          <q>role?.name</q>
        </>,
      );
      onSuccess?.();
    },
    onError: error => {
      if (error.type === ERROR_TYPE.VALIDATION_CONSTRAINT) {
        setDeleteRoleError(error);
        return;
      }
      toast.error(error.message);
    },
  });

  useLayoutEffect(() => {
    if (roleId && isRoleNotFound) dismiss();
  }, [roleId, isRoleNotFound, dismiss]);

  const onClose = useCallback(() => {
    setDeleteRoleError(null);
    dismiss();
  }, [dismiss]);

  const handleConfirm = useCallback(() => {
    if (roleId) deleteRole(roleId);
  }, [deleteRole, roleId]);

  return (
    <>
      <ConfirmModal
        confirmButtonText={
          <TranslatedText stringId="general.action.delete-role" fallback="Delete role" />
        }
        title={<TranslatedText stringId="admin.roles.delete.title" fallback="Delete role" />}
        customContent={
          <>
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
          </>
        }
        open={Boolean(roleId) && !isRoleNotFound}
        onCancel={onClose}
        onConfirm={handleConfirm}
      />
      <RoleDeleteErrorModal
        open={deleteRoleError !== null}
        error={deleteRoleError}
        onClose={onClose}
      />
    </>
  );
};
