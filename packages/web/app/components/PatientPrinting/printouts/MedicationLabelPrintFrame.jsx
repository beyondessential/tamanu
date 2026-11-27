import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { LabelPrintFrame } from './LabelPrintFrame';
import { MedicationLabel, medicationLabelShape, useLabelDimensions } from './MedicationLabel';

/**
 * Prints medication labels one to a page, each page sized to the configured
 * label stock. Call `print()` on the ref; see LabelPrintFrame.
 */
export const MedicationLabelPrintFrame = forwardRef(({ labels }, ref) => {
  const { width, height } = useLabelDimensions();
  return (
    <LabelPrintFrame
      ref={ref}
      width={width}
      height={height}
      data-testid="medication-label-print-frame"
    >
      {labels.map((label, index) => (
        // Falls back on any falsy id, not just a nullish one: a blank id would
        // otherwise key every such label the same.
        <MedicationLabel key={label.id || index} data={label} />
      ))}
    </LabelPrintFrame>
  );
});

MedicationLabelPrintFrame.displayName = 'MedicationLabelPrintFrame';

MedicationLabelPrintFrame.propTypes = {
  labels: PropTypes.arrayOf(medicationLabelShape).isRequired,
};
