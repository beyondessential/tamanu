import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@material-ui/core';
import { Modal } from '../../Modal';
import { LabRequestPrintLabel } from '../printouts/LabRequestPrintLabel';

export const LabRequestPrintLabelModal = ({ open, onClose, patient, labRequests }) => {
  const patientId = patient.displayId;
  return (
    <Modal title="Print label" width="md" open={open} onClose={onClose} printable>
      <Box display="flex" alignItems="center" flexDirection="column" minHeight={250} pt={2}>
        {labRequests.map(lab => {
          return (
            <Box mb={3}>
              <LabRequestPrintLabel
                data={{
                  testId: lab.displayId,
                  patientId,
                  patientDateOfBirth: patient.dateOfBirth,
                  date: lab.sampleTime,
                  labCategory: lab.category?.name,
                }}
              />
            </Box>
          );
        })}
      </Box>
    </Modal>
  );
};

LabRequestPrintLabelModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  patient: PropTypes.object.isRequired,
  labRequests: PropTypes.array.isRequired,
};
