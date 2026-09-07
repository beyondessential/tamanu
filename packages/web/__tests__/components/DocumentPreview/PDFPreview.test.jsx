import * as React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../../helpers';

const { apiGet, getDocument } = vi.hoisted(() => ({ apiGet: vi.fn(), getDocument: vi.fn() }));

vi.mock('../../../app/api', () => ({ useApi: () => ({ get: apiGet }) }));
vi.mock('pdfjs-dist', () => ({ GlobalWorkerOptions: {}, getDocument }));

// Rendering a page needs a real canvas, which jsdom does not provide; stand in
// with the page number so the assertions read as what is on screen.
vi.mock('../../../app/components/DocumentPreview/PDFPage', () => ({
  PDFPage: ({ page }) => <div>{`Page ${page.pageNumber}`}</div>,
}));

import PDFPreview from '../../../app/components/DocumentPreview/PDFPreview';

const PDF = 'JVBERi0xLjQ=';
const PENDING_MESSAGE = 'This file is not available yet. Please try again shortly.';

const loadedDocument = (numPages) => ({
  promise: Promise.resolve({
    numPages,
    getPage: async (pageNumber) => ({ pageNumber }),
  }),
});

const renderPreview = () =>
  renderElementWithTranslatedText(
    <PDFPreview
      attachmentId="attachment-1"
      pageCount={0}
      setPageCount={vi.fn()}
      scrollPage={1}
      setScrollPage={vi.fn()}
    />,
  );

describe('PDFPreview', () => {
  beforeEach(() => {
    apiGet.mockReset();
    getDocument.mockReset();
  });

  // spec: ATCH
  // A 202 carries no bytes, so the base64 decode would be handed `undefined`
  // and the document would fail to open with no explanation.
  it('tells the clinician the document is not available yet', async () => {
    apiGet.mockResolvedValue({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });

    renderPreview();

    expect(await screen.findByText(PENDING_MESSAGE)).toBeTruthy();
    expect(getDocument).not.toHaveBeenCalled();
  });

  it('renders the pages when the content is served', async () => {
    apiGet.mockResolvedValue({ data: PDF });
    getDocument.mockReturnValue(loadedDocument(2));

    renderPreview();

    expect(await screen.findByText('Page 1')).toBeTruthy();
    expect(screen.getByText('Page 2')).toBeTruthy();
    expect(screen.queryByText(PENDING_MESSAGE)).toBeNull();
  });
});
