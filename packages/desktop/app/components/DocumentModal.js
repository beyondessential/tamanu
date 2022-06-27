import React from 'react';
import styled from 'styled-components';
import { CircularProgress, Typography, Box } from '@material-ui/core';
import { Modal } from './Modal';
import { DocumentForm } from '../forms/DocumentForm';

const Container = styled(Box)`
  padding: 40px 0;
  text-align: center;

  .MuiTypography-root {
    margin-top: 40px;
    font-weight: 500;
    font-size: 16px;
    line-height: 21px;
    color: ${props => props.theme.palette.text.secondary};
  }
`;

export const DocumentModal = ({ title, actionText, open, onClose, onSubmit, isSubmitting }) => (
  <Modal width="md" title={title} open={open} onClose={onClose}>
    {isSubmitting ? (
      <Container>
        <CircularProgress size="5rem" />
        <Typography>Please wait while we upload your document</Typography>
      </Container>
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
