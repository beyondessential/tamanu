import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { TranslatedText } from '../../Translation';
import { MedicationLabel, medicationLabelShape } from './MedicationLabel';
import { MedicationLabelPrintFrame } from './MedicationLabelPrintFrame';

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
`;

const PreviewDescription = styled(Box)`
  margin-bottom: 16px;
  font-size: 14px;
`;

/**
 * Shows the labels on screen and carries the hidden frame they get printed
 * from. Call `print()` on the ref to print them.
 */
export const MedicationLabelPrintPreview = forwardRef(({ labels, showDescription = true }, ref) => (
  <>
    {showDescription && (
      <PreviewDescription>
        <TranslatedText
          stringId="medication.dispenseAndPrint.description"
          fallback="Please review the medication label/s below. Select Back to make changes, or Dispense & print to complete."
        />
      </PreviewDescription>
    )}
    <PreviewContainer>
      {labels.map((label, index) => (
        <MedicationLabel key={label.id ?? index} data={label} />
      ))}
    </PreviewContainer>
    <MedicationLabelPrintFrame ref={ref} labels={labels} />
  </>
));

MedicationLabelPrintPreview.displayName = 'MedicationLabelPrintPreview';

MedicationLabelPrintPreview.propTypes = {
  labels: PropTypes.arrayOf(medicationLabelShape).isRequired,
  showDescription: PropTypes.bool,
};
