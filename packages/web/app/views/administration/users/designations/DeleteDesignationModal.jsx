import { Typography } from '@mui/material';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { ERROR_TYPE } from '@tamanu/errors';
import { Button, ButtonRow, Modal } from '@tamanu/ui-components';
import { TranslatedText } from '../../../../components';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { ConfirmRowDivider } from '../../../../components/ConfirmRowDivider';
import { shortInlineSkeleton } from '../components';
import { useDesignationDeleteMutation } from './useDesignationDeleteMutation';
import { useDesignationQuery } from './useDesignationQuery';

const ModalContent = styled.div`
  min-block-size: 8rem;
  display: grid;
  place-items: center stretch;
`;

const DeleteDesignationErrorModal = ({ open, error, onClose }) => {
  if (!Error.isError(error)) return null;

  const designationId = error?.extra?.get?.('designation-id');
  const _assignedUserCount = Number.parseInt(error?.extra?.get?.('assigned-user-count'), 10);
  const assignedUserCount = Number.isSafeInteger(_assignedUserCount) ? _assignedUserCount : null;

  const isExpectedError = Boolean(designationId && assignedUserCount);
  if (!isExpectedError) {
    toast.error(
      error?.detail || error?.message || (
        <TranslatedText
          stringId="admin.designations.delete.error.generic"
          fallback="Couldn’t delete designation"
        />
      ),
    );
    return null;
  }

  const isSingular = assignedUserCount === 1;
  const title = isSingular ? (
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

  const detailReplacements = { designationId, count: assignedUserCount.toLocaleString() };
  const detail = isSingular ? (
    <TranslatedText
      stringId="admin.designations.delete.error.detail.singular"
      fallback={
        'Cannot delete designation with ID ‘:designationId’ as :count\u{00A0}user is assigned to it. Please update their profile first to delete the designation.'
      }
      replacements={detailReplacements}
    />
  ) : (
    <TranslatedText
      stringId="admin.designations.delete.error.detail.plural"
      fallback={
        'Cannot delete designation with ID ‘:designationId’ as :count\u{00A0}users are assigned to it. Please update their profiles first to delete the designation.'
      }
      replacements={detailReplacements}
    />
  );

  return (
    <Modal open={open} onClose={onClose} width="sm" title={title}>
      <ModalContent>
        <Typography variant="body2">{detail}</Typography>
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

export const DeleteDesignationModal = ({ onSuccess }) => {
  const deleteMatch = useMatch(
    '/admin/users/rolesAndDesignations/designations/delete/:designationId',
  );
  const designationId = deleteMatch?.params.designationId;

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

  const [deleteDesignationError, setDeleteDesignationError] = useState(null);

  useLayoutEffect(() => {
    if (designationId && isDesignationNotFound) dismiss();
  }, [designationId, isDesignationNotFound, dismiss]);

  const { mutate: deleteDesignation } = useDesignationDeleteMutation({
    onSuccess: () => {
      setDeleteDesignationError(null);
      dismiss();
      toast.success(
        <TranslatedText
          stringId="admin.designations.delete.success"
          fallback="Designation deleted"
        />,
      );
      onSuccess?.();
    },
    onError: error => {
      if (error.type === ERROR_TYPE.VALIDATION_CONSTRAINT) {
        setDeleteDesignationError(error);
        return;
      }
      toast.error(
        error.detail || error.message || (
          <TranslatedText
            stringId="admin.designations.delete.error.generic"
            fallback="Couldn’t delete designation"
          />
        ),
      );
    },
  });

  const onClose = useCallback(() => {
    setDeleteDesignationError(null);
    dismiss();
  }, [dismiss]);

  const handleConfirm = useCallback(() => {
    if (designationId) deleteDesignation(designationId);
  }, [deleteDesignation, designationId]);

  return (
    <>
      <ConfirmModal
        confirmButtonText={
          <TranslatedText
            stringId="general.action.delete-designation"
            fallback="Delete designation"
          />
        }
        title={
          <TranslatedText
            stringId="admin.designations.delete.title"
            fallback="Delete designation"
          />
        }
        customContent={
          <ModalContent>
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
          </ModalContent>
        }
        open={Boolean(designationId) && !isDesignationNotFound}
        onCancel={onClose}
        onConfirm={handleConfirm}
      />
      <DeleteDesignationErrorModal
        open={deleteDesignationError !== null}
        error={deleteDesignationError}
        onClose={onClose}
      />
    </>
  );
};
