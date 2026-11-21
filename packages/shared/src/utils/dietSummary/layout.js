// Geometry the printed sheet and its page-break estimate both read. react-pdf offers no way to
// measure a row before laying it out, so estimateWardPresence predicts one from these numbers —
// which means a change to the stylesheet that left the estimate behind would strand a ward's
// heading at the foot of a page again. Declared here so the two move together.

export const COLUMN_HEADER_HEIGHT = 72;
export const NAME_WIDTH = 115;
export const CELL_PADDING_VERTICAL = 4;
// Average glyph advance in a name at the cell's 8pt, which is what tells the estimate when a name
// wraps its column.
export const NAME_CHAR_WIDTH = 4.4;
