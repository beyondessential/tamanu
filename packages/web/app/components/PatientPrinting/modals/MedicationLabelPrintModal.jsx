import React from 'react';
import PropTypes from 'prop-types';
import styled, { createGlobalStyle } from 'styled-components';
import { Box } from '@material-ui/core';
import { Modal, TranslatedText, ConfirmCancelRow } from '@tamanu/ui-components';
import { MedicationLabel } from '../printouts/MedicationLabel';
import { Colors } from '../../../constants';

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
    padding: 0;
  }
`;

const StyledModal = styled(Modal)`
  .MuiDialogActions-root {
    position: sticky;
    bottom: 0;
    background: ${Colors.background};
    border-top: 1px solid ${Colors.outline};
    padding: 10px 40px 20px 40px;
  }
`;

const PrintStyles = createGlobalStyle`
  @media print {
    @page {
      margin: 0;
      size: auto;
    }

    html, body {
      margin: 0;
      padding: 0;
    }

    .MuiDialogTitle-root,
    .MuiDialogActions-root {
      display: none;
    }
  }
`;

export const MedicationLabelPrintModal = ({ open, onClose, labels }) => {
  const handlePrint = () => {
    print();
  };

  return (
    <StyledModal
      title={<TranslatedText stringId="medication.modal.printLabel.title" fallback="Print label" />}
      width="sm"
      open={open}
      onClose={onClose}
      actions={
        <ConfirmCancelRow
          onCancel={onClose}
          onConfirm={handlePrint}
          cancelText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
          confirmText={
            <TranslatedText stringId="medication.action.printLabel" fallback="Print label" />
          }
        />
      }
    >
      <PrintStyles />
      <Container>
        {labels.map((label, index) => (
          <Box key={label.id || index} mb={0}>
            <MedicationLabel data={label} />
          </Box>
        ))}
      </Container>
    </StyledModal>
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
      prescriberName: PropTypes.string.isRequired,
      requestNumber: PropTypes.string.isRequired,
      facilityAddress: PropTypes.string,
      facilityContactNumber: PropTypes.string,
    }),
  ).isRequired,
};
