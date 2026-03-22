import React, { useCallback } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

import { getErrorMessage, removeForbiddenError } from '../store/specialModals';
import { Modal } from './Modal';
import { ModalActionRow } from './ModalActionRow';
import { TranslatedText } from './Translation/TranslatedText';

const StyledTypography = styled.p`
  margin: 60px 20px;
`;

export const ForbiddenErrorModalContents = ({ onConfirm, confirmText }) => (
  <>
    <StyledTypography gutterBottom data-testid="styledtypography-ajow">
      <TranslatedText
        stringId="error.forbidden.message"
        fallback="You don't have permission to perform this action. Please contact your system administrator if you believe you should have permission."
        data-testid="translatedtext-forbidden-message"
      />
    </StyledTypography>
    <ModalActionRow
      onConfirm={onConfirm}
      confirmText={confirmText}
      data-testid="modalactionrow-ooxp"
    />
  </>
);

export const ForbiddenErrorModal = () => {
  const navigate = useNavigate();
  const errorMessage = useSelector(getErrorMessage);
  const dispatch = useDispatch();
  const handleClose = useCallback(() => {
    dispatch(removeForbiddenError());
  }, [dispatch]);
  const handleConfirm = useCallback(() => {
    handleClose();
    navigate(-1);
  }, [navigate, handleClose]);

  if (errorMessage === null) {
    return null;
  }

  return (
    <Modal
      title={
        <TranslatedText
          stringId="error.forbidden.title"
          fallback="Forbidden"
          data-testid="translatedtext-forbidden-title"
        />
      }
      open
      onClose={handleClose}
      data-testid="modal-w8lm"
    >
      <ForbiddenErrorModalContents
        onConfirm={handleConfirm}
        confirmText={
          <TranslatedText
            stringId="general.action.navigateBack"
            fallback="Navigate back"
            data-testid="translatedtext-navigate-back"
          />
        }
        data-testid="forbiddenerrormodalcontents-f43a"
      />
    </Modal>
  );
};
