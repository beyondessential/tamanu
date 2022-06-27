import React from 'react';
import styled from 'styled-components';
import CircularProgress from '@material-ui/core/CircularProgress';

import { Modal } from './Modal';
import { DocumentForm } from '../forms/DocumentForm';

const StyledDiv = styled.div`
  text-align: center;
`;

export const DocumentModal = ({ title, actionText, open, onClose, onSubmit, isSubmitting }) => (
  <Modal width="md" title={title} open={open} onClose={onClose}>
    {isSubmitting ? (
      <StyledDiv>
        <CircularProgress size="5rem" />
        <p>
          Your document is now uploading. You cannot navigate away from this screen while this
          process is happening - thanks for your patience, it is usually completed quickly.
        </p>
      </StyledDiv>
    ) : (
      <DocumentForm
        actionText={actionText}
        onSubmit={onSubmit}
        onCancel={onClose}
        editedObject={document}
      />
    )}
  </Modal>
);
