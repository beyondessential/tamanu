import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Modal, TranslatedText, ConfirmCancelRow } from '@tamanu/ui-components';
import { MedicationLabelPrintPreview } from '../printouts/MedicationLabelPrintPreview';
import { medicationLabelShape } from '../printouts/MedicationLabel';
import { Colors } from '../../../constants';

const StyledModal = styled(Modal)`
  .MuiDialogActions-root {
    position: sticky;
    bottom: 0;
    background: ${Colors.background};
    border-top: 1px solid ${Colors.outline};
    padding: 10px 40px 20px 40px;
  }
`;

export const MedicationLabelPrintModal = ({ open, onClose, labels }) => {
  const labelPrintRef = useRef(null);

  const handlePrint = () => {
    labelPrintRef.current.print();
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
      <MedicationLabelPrintPreview ref={labelPrintRef} labels={labels} showDescription={false} />
    </StyledModal>
  );
};

MedicationLabelPrintModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  labels: PropTypes.arrayOf(medicationLabelShape).isRequired,
};
