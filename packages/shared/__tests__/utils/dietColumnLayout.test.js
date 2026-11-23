import { describe, expect, it } from 'vitest';

import {
  BORDER_WIDTH,
  PATIENT_COLUMNS_WIDTH,
  getDietColumnLayout,
} from '../../src/utils/dietSummary/layout';

const tableWidth = columnCount =>
  PATIENT_COLUMNS_WIDTH + columnCount * getDietColumnLayout(columnCount).columnWidth + BORDER_WIDTH;

describe('getDietColumnLayout', () => {
  it('keeps the diet columns one width and fills the rest of the page while there is room', () => {
    const few = getDietColumnLayout(3);
    const more = getDietColumnLayout(10);

    expect(few.hasFillColumn).toBe(true);
    expect(more.hasFillColumn).toBe(true);
    expect(more.columnWidth).toBe(few.columnWidth);
  });

  it('shares the whole width between the diet columns once an empty column would be a sliver', () => {
    const lastWithFill = [...Array(40).keys()].findLast(
      count => getDietColumnLayout(count).hasFillColumn,
    );
    const first = getDietColumnLayout(lastWithFill + 1);

    expect(first.hasFillColumn).toBe(false);
    expect(first.columnWidth).toBeGreaterThanOrEqual(getDietColumnLayout(lastWithFill).columnWidth);
    expect(tableWidth(lastWithFill + 1)).toBeCloseTo(tableWidth(40));
  });

  it('narrows the diet columns as they grow, so the sheet stays one page wide', () => {
    const thirty = getDietColumnLayout(30);
    const sixty = getDietColumnLayout(60);

    expect(sixty.hasFillColumn).toBe(false);
    expect(sixty.columnWidth).toBeLessThan(thirty.columnWidth);
    expect(tableWidth(60)).toBeCloseTo(tableWidth(30));
  });
});
