import { describe, expect, test } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { mergeAndStampPdfBytes } from '../../app/mergePdf';

const A4_PORTRAIT = [595, 842];
const A4_LANDSCAPE = [842, 595];

const makePdfBuffer = async pageSizes => {
  const doc = await PDFDocument.create();
  pageSizes.forEach(size => doc.addPage(size));
  const bytes = await doc.save();
  return bytes.buffer;
};

const loadMerged = async bytes => PDFDocument.load(bytes);

describe('mergeAndStampPdfs', () => {
  test('concatenates pages from every source document in order', async () => {
    const buffers = await Promise.all([
      makePdfBuffer([A4_PORTRAIT, A4_PORTRAIT]),
      makePdfBuffer([A4_PORTRAIT]),
      makePdfBuffer([A4_LANDSCAPE]),
    ]);

    const bytes = await mergeAndStampPdfBytes({
      buffers,
      pageNumberTemplate: ':currentPage of :totalPages',
    });
    const merged = await loadMerged(bytes);

    expect(merged.getPageCount()).toBe(4);
    // Order is preserved: the landscape page from the last source ends up last.
    expect(merged.getPage(3).getSize().width).toBeGreaterThan(merged.getPage(3).getSize().height);
  });

  test('produces a valid PDF when no page-number template is given', async () => {
    const buffers = await Promise.all([makePdfBuffer([A4_PORTRAIT])]);

    const bytes = await mergeAndStampPdfBytes({ buffers });
    const merged = await loadMerged(bytes);

    expect(merged.getPageCount()).toBe(1);
  });
});
