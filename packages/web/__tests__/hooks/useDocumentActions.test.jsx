import * as React from 'react';
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ToastContainer, toast } from 'react-toastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOB_AVAILABILITY_STATES } from '@tamanu/constants';

import { renderElementWithTranslatedText } from '../helpers';

const { apiGet } = vi.hoisted(() => ({ apiGet: vi.fn() }));

vi.mock('../../app/api', () => ({ useApi: () => ({ get: apiGet }) }));

import { useDocumentActions } from '../../app/hooks/useDocumentActions';

const DOCUMENT = {
  name: 'discharge-summary',
  type: 'application/pdf',
  attachmentId: 'attachment-1',
};
const PDF = 'JVBERi0xLjQ=';
const PENDING_MESSAGE = 'This file is not available yet. Please try again shortly.';

let fetchesBeforePicker;
let writtenBytes;

const stubSavePicker = () => {
  fetchesBeforePicker = null;
  writtenBytes = null;
  window.showSaveFilePicker = vi.fn(async () => {
    fetchesBeforePicker = apiGet.mock.calls.length;
    return {
      createWritable: async () => ({
        write: async (data) => {
          writtenBytes = data;
        },
        close: async () => {},
      }),
    };
  });
};

const printIframes = () => document.querySelectorAll('iframe');

const Harness = () => {
  const { onDownload, onPrintPDF } = useDocumentActions();
  return (
    <>
      <button type="button" onClick={() => onDownload(DOCUMENT)}>
        Download
      </button>
      <button type="button" onClick={() => onPrintPDF(DOCUMENT.attachmentId)}>
        Print
      </button>
    </>
  );
};

const clickAction = async (name) => {
  renderElementWithTranslatedText(
    <>
      <ToastContainer />
      <Harness />
    </>,
  );
  await userEvent.click(screen.getByRole('button', { name }));
};

describe('useDocumentActions', () => {
  beforeEach(() => {
    apiGet.mockReset();
    stubSavePicker();
    URL.createObjectURL = vi.fn(() => 'blob:document');
  });

  afterEach(() => {
    toast.dismiss();
    delete window.showSaveFilePicker;
  });

  describe('download', () => {
    it('reports the file is not available yet rather than a raw error', async () => {
      apiGet.mockResolvedValue({ availability: BLOB_AVAILABILITY_STATES.AWAITING_UPLOAD });

      await clickAction('Download');

      expect(await screen.findByText(PENDING_MESSAGE)).toBeTruthy();
      expect(writtenBytes).toBeNull();
    });

    it('writes the served content to the file the user picked', async () => {
      apiGet.mockResolvedValue({ data: PDF });

      await clickAction('Download');

      expect(await screen.findByText('Successfully downloaded file')).toBeTruthy();
      expect(Buffer.from(writtenBytes).toString('base64')).toBe(PDF);
    });

    // The save picker needs the click's transient user activation, which an
    // awaited network call can outlive, so the fetch belongs inside saveFile's
    // data callback and must not be hoisted above it.
    it('opens the save picker before fetching anything', async () => {
      apiGet.mockResolvedValue({ data: PDF });

      await clickAction('Download');

      expect(await screen.findByText('Successfully downloaded file')).toBeTruthy();
      expect(fetchesBeforePicker).toBe(0);
    });
  });

  describe('print', () => {
    it('reports the file is not available yet and sends nothing to the printer', async () => {
      apiGet.mockResolvedValue({ availability: BLOB_AVAILABILITY_STATES.AWAITING_FETCH });

      await clickAction('Print');

      expect(await screen.findByText(PENDING_MESSAGE)).toBeTruthy();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      expect(printIframes()).toHaveLength(0);
    });

    it('sends the served content to the printer', async () => {
      apiGet.mockResolvedValue({ data: PDF });

      await clickAction('Print');

      await vi.waitFor(() => expect(printIframes()).toHaveLength(1));
      expect(printIframes()[0].src).toBe('blob:document');
      expect(screen.queryByText(PENDING_MESSAGE)).toBeNull();
    });
  });
});
