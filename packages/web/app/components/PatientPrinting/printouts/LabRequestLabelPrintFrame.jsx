import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { LabelPrintFrame } from './LabelPrintFrame';
import { LabRequestPrintLabel, LAB_LABEL_DIMENSIONS } from './LabRequestPrintLabel';

/**
 * Prints lab request sample labels one to a page, each page sized to the
 * label. Call `print()` on the ref; see LabelPrintFrame.
 */
export const LabRequestLabelPrintFrame = forwardRef(({ labels }, ref) => (
  <LabelPrintFrame
    ref={ref}
    width={LAB_LABEL_DIMENSIONS.width}
    height={LAB_LABEL_DIMENSIONS.height}
    data-testid="lab-request-label-print-frame"
  >
    {labels.map((label, index) => (
      <LabRequestPrintLabel key={label.requestId || index} data={label} />
    ))}
  </LabelPrintFrame>
));

LabRequestLabelPrintFrame.displayName = 'LabRequestLabelPrintFrame';

LabRequestLabelPrintFrame.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.object).isRequired,
};
