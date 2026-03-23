import { Typography } from '@mui/material';
import React, { useCallback, useLayoutEffect } from 'react';
import { useMatch, useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import styled from 'styled-components';

import { TranslatedText } from '../../../../components';
import { ConfirmModal } from '../../../../components/ConfirmModal';
import { shortInlineSkeleton } from '../components';
import { useDesignationDeleteMutation } from './useDesignationDeleteMutation';
import { useDesignationQuery } from './useDesignationQuery';

const ModalContent = styled.div`
  min-block-size: 8rem;
  display: grid;
  place-items: center stretch;
`;

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

  useLayoutEffect(() => {
    if (designationId && isDesignationNotFound) dismiss();
  }, [designationId, isDesignationNotFound, dismiss]);

  const { mutate: deleteDesignation } = useDesignationDeleteMutation({
    onSuccess: () => {
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
      toast.error(
        error.message || (
          <TranslatedText
            stringId="admin.designations.delete.error"
            fallback="Couldn’t delete designation"
          />
        ),
      );
    },
  });

  const onClose = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handleConfirm = useCallback(() => {
    if (designationId) deleteDesignation(designationId);
  }, [deleteDesignation, designationId]);

  return (
    <ConfirmModal
      confirmButtonText={
        <TranslatedText
          stringId="general.action.delete-designation"
          fallback="Delete designation"
        />
      }
      title={
        <TranslatedText stringId="admin.designations.delete.title" fallback="Delete designation" />
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
  );
};
