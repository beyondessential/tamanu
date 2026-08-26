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
 *
 * `print()` on the ref resolves once the browser has taken the job, so a caller
 * that closes on print can await it and not pull the frame out from under a
 * print dialog that is still reading the document.
 */
export const MedicationLabelPrintFrame = forwardRef(({ labels }, ref) => {
  const { width, height } = useLabelDimensions();
  const frameRef = useRef(null);
  const [frameDocument, setFrameDocument] = useState(null);

  // Adopted in a callback ref rather than an effect so it happens in the same
  // commit that attaches the frame: the labels are portalled in before the
  // browser paints, instead of a render later.
  const attachFrame = useCallback(frame => {
    frameRef.current = frame;
    setFrameDocument(frame?.contentDocument ?? null);
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    // Chromium has the about:blank document ready as soon as the frame is in
    // the DOM, which is what the callback ref picks up. Gecko and WebKit can
    // swap in a fresh one once the initial load settles, so follow that too —
    // otherwise the labels would be left in a document nobody prints.
    const readoptDocument = () => setFrameDocument(frame.contentDocument);
    frame.addEventListener('load', readoptDocument);
    return () => frame.removeEventListener('load', readoptDocument);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      print: () => {
        const frame = frameRef.current;
        // This handle and the portal are committed together, so a mismatch here
        // means the frame has swapped its document and the labels have not
        // landed in the new one yet. Reachable only in the instant between the
        // frame mounting and its load settling, which is long before there is a
        // print button to click — but printing a blank label is worse than not
        // printing, so say so rather than carry on.
        if (frame.contentDocument !== frameDocument) {
          throw new Error('Cannot print: the medication label frame is not ready');
        }
        return new Promise(resolve => {
          const frameWindow = frame.contentWindow;
          // Chromium and Gecko block inside print() and fire afterprint before
          // it returns; WebKit returns straight away and fires it when the
          // sheet is dismissed. Resolving on the event covers both.
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
        data-testid="medication-label-print-frame"
      />
      {frameDocument &&
        createPortal(
          <StyleSheetManager target={frameDocument.head}>
            <>
              <FrameStyles $width={width} $height={height} />
              {labels.map((label, index) => (
                // Falls back on any falsy id, not just a nullish one: a blank
                // id would otherwise key every such label the same.
                <LabelPage key={label.id || index}>
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
