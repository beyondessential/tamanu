// How much room a ward needs before it is worth starting on a page: its heading, its column
// headers, its Sub total row and its first patient row. react-pdf asks for this up front, as the
// `minPresenceAhead` of the spacer before each ward, and offers no way to measure a row before
// laying it out — so it is estimated from the row's own name.
//
// A name too long for its column wraps, and a wrapped line under the global font is about twice
// the height of one in the fallback. No single constant serves both: a value large enough for a
// wrapping name under the global font pushes ordinary sheets onto extra pages, and one sized for
// an ordinary row leaves a ward's heading stranded at the foot of a page with no patient beneath
// it, under a "(continued)" on the page after.
//
// spec: DIETSUM#layout

import {
  CELL_PADDING_VERTICAL,
  COLUMN_HEADER_HEIGHT,
  NAME_CHAR_WIDTH,
  NAME_WIDTH,
} from './layout';

const WARD_HEADING_HEIGHT = 15;
const ROW_PADDING = CELL_PADDING_VERTICAL * 2;
const PLAIN_LINE_HEIGHT = 11;
const GLOBAL_FONT_LINE_HEIGHT = 22;
const NAME_CHARS_PER_LINE = Math.floor(NAME_WIDTH / NAME_CHAR_WIDTH);

const estimateRowHeight = (patient, lineHeight) => {
  const name = `${patient?.firstName ?? ''} ${patient?.lastName ?? ''}`.trim();
  const lines = Math.max(1, Math.ceil(name.length / NAME_CHARS_PER_LINE));
  return lines * lineHeight + ROW_PADDING;
};

export const estimateWardPresence = (area, isGlobalFont) => {
  const lineHeight = isGlobalFont ? GLOBAL_FONT_LINE_HEIGHT : PLAIN_LINE_HEIGHT;
  const subTotalRow = lineHeight + ROW_PADDING;
  return (
    WARD_HEADING_HEIGHT +
    COLUMN_HEADER_HEIGHT +
    subTotalRow +
    estimateRowHeight(area?.patients?.[0], lineHeight)
  );
};
