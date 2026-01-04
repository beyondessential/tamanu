import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { Modal, TranslatedText, ConfirmCancelRow } from '@tamanu/ui-components';
import { MedicationLabel } from '../printouts/MedicationLabel';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 20px 0;

  @media print {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 15px;
  }
`;

const StyledConfirmCancelRow = styled(ConfirmCancelRow)`
  padding: 12px 32px;
  padding-top: 0px;
`;

export const MedicationLabelPrintModal = ({ open, onClose, labels }) => {
  const handlePrint = () => {
    print();
  };

  return (
    <Modal
      title={<TranslatedText stringId="medication.modal.printLabel.title" fallback="Print label" />}
      width="sm"
      open={open}
      onClose={onClose}
      actions={
        <StyledConfirmCancelRow
          onCancel={onClose}
          onConfirm={handlePrint}
          cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
          confirmText={
            <TranslatedText stringId="medication.action.printLabel" fallback="Print label" />
          }
        />
      }
    >
      <Container>
        {labels.map((label, index) => (
          <Box key={label.id || index} mb={0}>
            <MedicationLabel data={label} />
          </Box>
        ))}
      </Container>
    </Modal>
  );
};

MedicationLabelPrintModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  labels: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      medicationName: PropTypes.string.isRequired,
      instructions: PropTypes.string.isRequired,
      patientName: PropTypes.string.isRequired,
      dispensedAt: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      repeatsRemaining: PropTypes.number.isRequired,
      prescriberName: PropTypes.string.isRequired,
      requestNumber: PropTypes.string.isRequired,
      facilityAddress: PropTypes.string,
      facilityContactNumber: PropTypes.string,
    }),
  ).isRequired,
};
