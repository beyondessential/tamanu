import React from 'react';
import PropTypes from 'prop-types';
import styled, { createGlobalStyle } from 'styled-components';
import { Box } from '@material-ui/core';
import { TranslatedText } from '../../Translation';
import { Colors } from '../../../constants';
import { MedicationLabel } from './MedicationLabel';

const PrintContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
`;

const PrintDescription = styled(Box)`
  margin-bottom: 16px;
  font-size: 14px;
  color: ${Colors.midText};

  @media print {
    display: none;
  }
`;

export const PrintStyles = createGlobalStyle`
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

    .MuiDialog-container,
    .MuiDialog-paper,
    .MuiPaper-root,
    .MuiDialogContent-root {
      margin: 0;
      padding: 0;
    }

    /* Target ModalContainer and ModalContent BaseModal */
    .MuiDialog-paper > div,
    .MuiDialog-paper > div > div:first-child {
      margin: 0;
      padding: 0;
    }
  }
`;

export const MedicationLabelPrintPreview = ({ labels, showDescription = true }) => {
  return (
    <>
      <PrintStyles />
      {showDescription && (
        <PrintDescription>
          <TranslatedText
            stringId="medication.dispenseAndPrint.description"
            fallback="Please review the medication label/s below. Select Back to make changes, or Dispense & print to complete."
          />
        </PrintDescription>
      )}
      <PrintContainer>
        {labels.map((label, index) => (
          <MedicationLabel key={label.id || index} data={label} />
        ))}
      </PrintContainer>
    </>
  );
};

MedicationLabelPrintPreview.propTypes = {
  labels: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      medicationName: PropTypes.string.isRequired,
      instructions: PropTypes.string.isRequired,
      patientName: PropTypes.string.isRequired,
      dispensedAt: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      units: PropTypes.string,
      remainingRepeats: PropTypes.number.isRequired,
      prescriberName: PropTypes.string.isRequired,
      requestNumber: PropTypes.string.isRequired,
      facilityName: PropTypes.string,
    }),
  ).isRequired,
  showDescription: PropTypes.bool,
};
