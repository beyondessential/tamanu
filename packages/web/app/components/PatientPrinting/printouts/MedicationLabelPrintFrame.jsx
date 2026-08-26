import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import styled, { createGlobalStyle, StyleSheetManager } from 'styled-components';
import { MedicationLabel, medicationLabelShape, useLabelDimensions } from './MedicationLabel';

// Printing the app window means printing the whole app: the modal is
// position: fixed (so only its first page is laid out), MUI sizes the dialog
// paper relative to the page box (so a label wider than the paper is clipped),
// and the view behind the modal is still in the document. Printing a frame that
// only ever contains labels sidesteps all of that, and lets @page describe the
// label stock without any of the app's layout having to agree with it.
//
// The frame has to stay in the layout tree for its document to be laid out at
// all, so it is parked off-screen at no size rather than hidden with
// display: none or visibility: hidden.
const PrintFrame = styled.iframe`
  position: absolute;
  inset-block-start: -1000px;
  inset-inline-start: -1000px;
  border: 0;
  block-size: 0;
  inline-size: 0;
`;

const FrameStyles = createGlobalStyle`
  @page {
    margin: 0;
    size: ${props => props.$width}mm ${props => props.$height}mm;
  }

  html {
    box-sizing: border-box;
    // The frame document inherits none of the app's stylesheets, so without
    // this the labels would render in the browser's default serif face and lay
    // out differently from the preview. Mirrors app/fonts.css.
    font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  body {
    margin: 0;
  }
`;

// The page is the label, so this only has to carry the break. Deliberately no
// height and no centring: sizing the page against the viewport (100vh) or the
// initial containing block (height: 100%) would mean betting on how a frame
// being printed on its own resolves those, and getting it wrong gives blank
// pages rather than a slightly misplaced label.
const LabelPage = styled.div`
  &:not(:last-child) {
    break-after: page;
    page-break-after: always;
  }
`;

/**
 * Renders the labels into a hidden same-origin frame and prints that frame.
 * Call `print()` on the ref to open the print dialog.
 */
export const MedicationLabelPrintFrame = forwardRef(({ labels }, ref) => {
  const { width, height } = useLabelDimensions();
  const frameRef = useRef(null);
  const [frameDocument, setFrameDocument] = useState(null);

  useEffect(() => {
    const frame = frameRef.current;
    // Chrome has the about:blank document ready as soon as the frame is in the
    // DOM; other engines swap in a fresh one once the initial load settles.
    const adoptDocument = () => setFrameDocument(frame.contentDocument);
    adoptDocument();
    frame.addEventListener('load', adoptDocument);
    return () => frame.removeEventListener('load', adoptDocument);
  }, []);

  useImperativeHandle(ref, () => ({ print: () => frameRef.current.contentWindow.print() }), []);

  return (
    <>
      <PrintFrame
        ref={frameRef}
        aria-hidden
        tabIndex={-1}
        data-testid="medication-label-print-frame"
      />
      {frameDocument &&
        createPortal(
          <StyleSheetManager target={frameDocument.head}>
            <>
              <FrameStyles $width={width} $height={height} />
              {labels.map((label, index) => (
                <LabelPage key={label.id ?? index}>
                  <MedicationLabel data={label} />
                </LabelPage>
              ))}
            </>
          </StyleSheetManager>,
          frameDocument.body,
        )}
    </>
  );
});

MedicationLabelPrintFrame.displayName = 'MedicationLabelPrintFrame';

MedicationLabelPrintFrame.propTypes = {
  labels: PropTypes.arrayOf(medicationLabelShape).isRequired,
};
