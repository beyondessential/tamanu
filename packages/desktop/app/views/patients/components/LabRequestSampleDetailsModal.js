import React from 'react';
import { Box } from '@material-ui/core';
import { Button, Modal } from '../../../components';
import { LabRequestSampleDetailsCard } from './LabRequestSampleDetailsCard';

export const LabRequestSampleDetailsModal = ({ open, onClose, labRequest }) => {
  return (
    <Modal open={open} onClose={onClose} title="Sample details" disableHeaderCloseIcon>
      <LabRequestSampleDetailsCard labRequest={labRequest} />
      <Box display="flex" justifyContent="flex-end" pt={3}>
        <Button onClick={onClose}>Close</Button>
      </Box>
    </Modal>
  );
};
