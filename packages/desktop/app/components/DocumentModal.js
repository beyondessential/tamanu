import React from 'react';
import styled from 'styled-components';
import CircularProgress from '@material-ui/core/CircularProgress';

import { Modal } from './Modal';
import { DocumentForm } from '../forms/DocumentForm';

const StyledDiv = styled.div`
  text-align: center;
`;

export const DocumentModal = ({ title, actionText, open, onClose, onSubmit, isSubmitting }) => {
  return (
    <Modal width="md" title={title} open={open} onClose={onClose}>
      {isSubmitting
        ? (<StyledDiv>
            <CircularProgress size="5rem" />
            <p>Your file is being uploaded, please wait.</p>
          </StyledDiv>)
        : (<DocumentForm
            actionText={actionText}
            onSubmit={onSubmit}
            onCancel={onClose}
            editedObject={document}
          />)
      }
    </Modal>
  );
};
