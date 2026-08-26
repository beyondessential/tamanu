import React from 'react';
import PropTypes from 'prop-types';
import styled, { createGlobalStyle } from 'styled-components';
import { Box } from '@material-ui/core';
import { TranslatedText } from '../../Translation';
import { MedicationLabel, useLabelDimensions } from './MedicationLabel';

const PrintContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;

  @media print {
    // Each LabelPrintPage fills and forces a break onto its own page, so this
    // gap would otherwise add extra height on top of that and misalign it.
    gap: 0;
  }
`;

const LabelPrintPage = styled.div`
  @media print {
    // The printer/OS paper size doesn't always end up matching the label's own
    // exact mm dimensions (e.g. the driver falls back to a larger default
    // media size), so centre the label within whichever page size is actually
    // used rather than assuming it fills the page.
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100vh;

    &:not(:last-child) {
      break-after: page;
      page-break-after: always;
    }
  }
`;

const PrintDescription = styled(Box)`
  margin-bottom: 16px;
  font-size: 14px;

  @media print {
    display: none;
  }
`;

export const PrintStyles = createGlobalStyle`
  @media print {
    @page {
      margin: 0;
      size: ${props => props.$width}mm ${props => props.$height}mm;
    }

    html, body {
      margin: 0;
      padding: 0;
    }

    // The app renders into #root and MUI portals the modal to <body>, so without
    // this the view behind the modal is still part of the print document and
    // comes out as a leading page.
    #root {
      display: none;
    }

    // A fixed-position element is laid out on the first page only, so every label
    // after the first would be silently dropped.
    .MuiDialog-root {
      position: static;
    }

    // The modal is opened with fullWidth, so MUI sizes the paper to
    // calc(100% - 64px). Under print, 100% is the *page* width — which @page above
    // has pinned to the label size — so the paper ends up 64px narrower than the
    // label it holds (63mm for an 80mm label). The label has flex-shrink: 0 and is
    // centred, so it overflows ~8.5mm off each edge and the left overflow is
    // clipped away entirely. Let the paper be the full page instead.
    .MuiDialog-container .MuiDialog-paper {
      width: 100%;
      max-width: none;
    }

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
  const { width, height } = useLabelDimensions();

  return (
    <>
      <PrintStyles $width={width} $height={height} />
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
          <LabelPrintPage key={label.id || index}>
            <MedicationLabel data={label} />
          </LabelPrintPage>
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
