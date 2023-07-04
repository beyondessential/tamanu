import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { getErrorMessage, removeForbiddenError } from '../store/specialModals';
import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';

export const FORBIDDEN_ERROR_MESSAGE = `You don't have permission to perform this action, please contact your system administrator if you believe you should have permission.`;

const StyledTypography = styled.p`
  margin: 60px 20px;
`;

export const ForbiddenError = ({ onConfirm, confirmText }) => (
  <>
    <StyledTypography gutterBottom>{FORBIDDEN_ERROR_MESSAGE}</StyledTypography>
    <ModalActionRow onConfirm={onConfirm} confirmText={confirmText} />
  </>
);
export const ForbiddenErrorModal = () => {
  const history = useHistory();
  const errorMessage = useSelector(getErrorMessage);
  const dispatch = useDispatch();
  const handleClose = useCallback(() => {
    dispatch(removeForbiddenError());
  }, [dispatch]);
  const handleConfirm = useCallback(() => {
    handleClose();
    history.goBack();
  }, [history, handleClose]);

  if (errorMessage === null) {
    return null;
  }

  return (
    <Modal title="Forbidden" open onClose={handleClose}>
      <ForbiddenError onConfirm={handleConfirm} confirmText="Navigate back" />
    </Modal>
  );
};
