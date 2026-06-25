import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// These match the page-number position/appearance in the react-pdf Footer
// (packages/shared/.../printComponents/Footer.jsx) so the stamped count lines up with where
// the inline counter would otherwise sit, on the same baseline as the left-hand footer text.
const FOOTER_RIGHT_INSET = 50;
const FOOTER_BASELINE = 28;
const FONT_SIZE = 8;
const FOOTER_GREY = rgb(0x88 / 0xff, 0x88 / 0xff, 0x88 / 0xff);

const formatPageNumber = (template, currentPage, totalPages) =>
  template.replace(':currentPage', currentPage).replace(':totalPages', totalPages);

/**
 * Merge an ordered list of sources into one document and stamp a continuous
 * ":currentPage of :totalPages" footer onto every page, returning the raw bytes.
 *
 * react-pdf restarts its page counter per document, so a document that has been split into
 * chunks and merged can't number its own pages — the count is stamped here, after merging,
 * using the already-localised pageNumberTemplate resolved on the main thread.
 *
 * `sources` is consumed lazily via `loadBytes` one at a time, and each entry is dropped once its
 * pages are copied, so only a single source document is held in memory on top of the growing
 * merged document rather than all of them at once.
 */
const mergeAndStamp = async (sources, loadBytes, pageNumberTemplate) => {
  const merged = await PDFDocument.create();

  for (let index = 0; index < sources.length; index++) {
    const source = sources[index];
    sources[index] = null; // drop the array's reference so the source can be reclaimed
    const doc = await PDFDocument.load(await loadBytes(source));
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach(page => merged.addPage(page));
  }

  if (pageNumberTemplate) {
    const font = await merged.embedFont(StandardFonts.Helvetica);
    const pages = merged.getPages();
    const totalPages = pages.length;
    pages.forEach((page, index) => {
      const text = formatPageNumber(pageNumberTemplate, index + 1, totalPages);
      const { width } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, FONT_SIZE);
      page.drawText(text, {
        x: width - FOOTER_RIGHT_INSET - textWidth,
        y: FOOTER_BASELINE,
        size: FONT_SIZE,
        font,
        color: FOOTER_GREY,
      });
    });
  }

  return merged.save();
};

/**
 * Worker entrypoint. Blobs are cheap to hand across the worker boundary (structured clone shares
 * the underlying bytes rather than copying), and each is read into an ArrayBuffer only when its
 * turn comes in the merge loop, so the main thread never materialises all the chunks at once.
 */
export const mergeAndStampPdfs = async ({ blobs, pageNumberTemplate }) =>
  new Blob([await mergeAndStamp(blobs, blob => blob.arrayBuffer(), pageNumberTemplate)], {
    type: 'application/pdf',
  });

// Direct ArrayBuffer entrypoint, used by tests (no Blob dependency in the test environment).
export const mergeAndStampPdfBytes = ({ buffers, pageNumberTemplate }) =>
  mergeAndStamp(buffers, buffer => buffer, pageNumberTemplate);
