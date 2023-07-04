import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';

import { getErrorMessage, removeForbiddenError } from '../store/specialModals';
import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';

const COPY_TEXT = `You don't have permission to perform this action, please contact your system administrator if you believe you should have permission.`;

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
      <Typography gutterBottom>{COPY_TEXT}</Typography>
      <ModalActionRow onConfirm={handleConfirm} confirmText="Navigate back" />
    </Modal>
  );
};
