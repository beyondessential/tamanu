import React from 'react';
import { Box } from '@mui/material';
import { Button, Modal } from '../../../components';
import { LabRequestSampleDetailsCard } from './LabRequestSampleDetailsCard';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const LabRequestSampleDetailsModal = ({ open, onClose, labRequest }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="lab.modal.sampleDetails.title"
          fallback="Sample details"
          data-testid="translatedtext-lab-modal-sample-details-title"
        />
      }
      data-testid="modal-ygg5"
    >
      <LabRequestSampleDetailsCard
        labRequest={labRequest}
        data-testid="labrequestsampledetailscard-ev5m"
      />
      <Box display="flex" justifyContent="flex-end" pt={3} data-testid="box-l50g">
        <Button onClick={onClose} data-testid="button-ugal">
          <TranslatedText
            stringId="general.action.close"
            fallback="Close"
            data-testid="translatedtext-close-action"
          />
        </Button>
      </Box>
    </Modal>
  );
};
