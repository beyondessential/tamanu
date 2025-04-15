import React from 'react';
import { Box } from '@material-ui/core';
import { Button, Modal } from '../../../components';
import { LabRequestSampleDetailsCard } from './LabRequestSampleDetailsCard';

export const LabRequestSampleDetailsModal = ({ open, onClose, labRequest }) => {
  return (
    <Modal open={open} onClose={onClose} title="Sample details" data-testid="modal-ygg5">
      <LabRequestSampleDetailsCard
        labRequest={labRequest}
        data-testid="labrequestsampledetailscard-ev5m"
      />
      <Box display="flex" justifyContent="flex-end" pt={3} data-testid="box-l50g">
        <Button onClick={onClose} data-testid="button-ugal">
          Close
        </Button>
      </Box>
    </Modal>
  );
};
