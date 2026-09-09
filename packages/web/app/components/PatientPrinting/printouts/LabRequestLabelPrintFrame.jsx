import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import styled, { createGlobalStyle, StyleSheetManager } from 'styled-components';
import { LabRequestPrintLabel, LAB_LABEL_DIMENSIONS } from './LabRequestPrintLabel';

// Printing the app window prints the whole app: the modal is position: fixed, MUI
// sizes the dialog paper to the page box, and the view behind the modal is still
// in the document. Printing a frame that only ever contains labels sidesteps all
// of that, and lets @page describe the label stock directly. Mirrors
// MedicationLabelPrintFrame.
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
    // The frame document inherits none of the app's stylesheets, so mirror
    // app/fonts.css so the labels render in Roboto rather than the browser default.
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

const LabelPage = styled.div`
  &:not(:last-child) {
    break-after: page;
    page-break-after: always;
  }
`;

/**
 * Renders the labels into a hidden same-origin frame and prints that frame.
 *
 * `print()` on the ref resolves once the browser has taken the job, so a caller
 * that closes on print can await it and not pull the frame out from under a
 * print dialog that is still reading the document.
 */
export const LabRequestLabelPrintFrame = forwardRef(({ labels }, ref) => {
  const { width, height } = LAB_LABEL_DIMENSIONS;
  const frameRef = useRef(null);
  const [frameDocument, setFrameDocument] = useState(null);

  const attachFrame = useCallback(frame => {
    frameRef.current = frame;
    setFrameDocument(frame?.contentDocument ?? null);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const readoptDocument = () => setFrameDocument(frame.contentDocument);
    frame.addEventListener('load', readoptDocument);
    return () => frame.removeEventListener('load', readoptDocument);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      print: () => {
        const frame = frameRef.current;
        if (frame.contentDocument !== frameDocument) {
          throw new Error('Cannot print: the lab request label frame is not ready');
        }
        return new Promise(resolve => {
          const frameWindow = frame.contentWindow;
          frameWindow.addEventListener('afterprint', resolve, { once: true });
          frameWindow.print();
        });
      },
    }),
    [frameDocument],
  );

  return (
    <>
      <PrintFrame
        ref={attachFrame}
        aria-hidden
        tabIndex={-1}
        data-testid="lab-request-label-print-frame"
      />
      {frameDocument &&
        createPortal(
          <StyleSheetManager target={frameDocument.head}>
            <>
              <FrameStyles $width={width} $height={height} />
              {labels.map((label, index) => (
                <LabelPage key={label.requestId || index}>
                  <LabRequestPrintLabel data={label} />
                </LabelPage>
              ))}
            </>
          </StyleSheetManager>,
          frameDocument.body,
        )}
    </>
  );
});

LabRequestLabelPrintFrame.displayName = 'LabRequestLabelPrintFrame';

LabRequestLabelPrintFrame.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.object).isRequired,
};
