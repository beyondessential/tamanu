// Geometry the printed sheet and its page-break estimate both read. react-pdf offers no way to
// measure a row before laying it out, so estimateWardPresence predicts one from these numbers —
// which means a change to the stylesheet that left the estimate behind would strand a ward's
// heading at the foot of a page again. Declared here so the two move together.

export const COLUMN_HEADER_HEIGHT = 72;
// Wide enough to keep an ordinary name and the age after it on one line.
export const NAME_WIDTH = 140;
export const CELL_PADDING_VERTICAL = 4;
// Average glyph advance at the cell's 8pt, which is what tells the estimate when a patient's name
// and age wrap their column.
export const NAME_CHAR_WIDTH = 4.4;

export const NHN_WIDTH = 60;
export const BED_WIDTH = 35;
export const PATIENT_COLUMNS_WIDTH = NAME_WIDTH + NHN_WIDTH + BED_WIDTH;
export const BORDER_WIDTH = 1;
const CONTENT_WIDTH = 742;
const DIET_COLUMN_WIDTH = 34;

// Diet columns keep their own width while the page has room for them and for an empty column
// beside them at least as wide, which takes up the rest. With less room than that the diet columns
// share the whole width instead, since a sliver of an empty column reads as a diet with no name,
// and they narrow as the diets grow so the sheet stays one page wide.
//
// spec: DIETSUM#layout
export const getDietColumnLayout = columnCount => {
  const widthForDiets = CONTENT_WIDTH - BORDER_WIDTH - PATIENT_COLUMNS_WIDTH;
  const widthLeftOver = widthForDiets - columnCount * DIET_COLUMN_WIDTH;
  const hasFillColumn = widthLeftOver >= DIET_COLUMN_WIDTH;
  return {
    columnWidth: hasFillColumn ? DIET_COLUMN_WIDTH : widthForDiets / columnCount,
    hasFillColumn,
  };
};
