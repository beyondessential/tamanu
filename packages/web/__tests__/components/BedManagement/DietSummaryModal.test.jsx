import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { createTheme } from '@material-ui/core/styles';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ERROR_TYPE } from '@tamanu/errors';

import { createQueryClient } from '../../helpers';
import { TranslationProvider } from '../../../app/contexts/Translation';
import { DietSummaryModal } from '../../../app/components/BedManagement/DietSummaryModal';

// vi.mock factories are hoisted above the imports, so the spy has to be hoisted with them.
const { mockGet } = vi.hoisted(() => {
  // Node 22+ has a built-in localStorage global that shadows jsdom's and is undefined unless
  // --localstorage-file is passed; ui-components reads it at module load.
  if (!globalThis.localStorage) {
    globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
  return { mockGet: vi.fn() };
});

vi.mock('../../../app/api', () => ({ useApi: () => ({ get: mockGet }) }));
vi.mock('../../../app/contexts/Auth', () => ({ useAuth: () => ({ facilityId: 'facility-test' }) }));
vi.mock('../../../app/contexts/Settings', () => ({ useSettings: () => ({ getSetting: () => null }) }));
vi.mock('../../../app/utils/useCertificate', () => ({
  useCertificate: () => ({ data: {}, isFetching: false }),
}));

// The sheet itself is react-pdf, which neither renders nor prints under jsdom. This test is about
// which of the modal's three branches is chosen, so the preview stands in for the document.
vi.mock('@tamanu/shared/utils/dietSummary', () => ({ DietSummaryPDF: () => null }));
vi.mock('../../../app/components/PatientPrinting/PDFLoader', () => ({
  PDFLoader: ({ children }) => <div data-testid="pdfloader-stub">{children}</div>,
  printPDF: vi.fn(),
}));

vi.mock('@tamanu/ui-components', async importOriginal => ({
  ...(await importOriginal()),
  useDateTime: () => ({
    formatShortest: () => '01/01/26',
    primaryTimeZone: 'Pacific/Palau',
    getCurrentDate: () => '2026-01-01',
  }),
}));

const FORBIDDEN_MESSAGE = /don't have permission/i;
const GENERIC_ERROR_MESSAGE = /something went wrong loading the diet summary/i;

const renderModal = () =>
  render(<DietSummaryModal open onClose={() => {}} />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={createQueryClient()}>
        <ThemeProvider theme={createTheme({})}>
          <TranslationProvider
            value={{
              getTranslation: (_stringId, fallback) => fallback,
              updateStoredLanguage: () => {},
              storedLanguage: 'en',
              translations: {},
            }}
          >
            {children}
          </TranslationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    ),
  });

const printButton = () => screen.queryByRole('button', { name: 'Print' });

describe('DietSummaryModal', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('shows the no-permission message and offers no print action when the request is forbidden', async () => {
    mockGet.mockRejectedValue(Object.assign(new Error('Forbidden'), { type: ERROR_TYPE.FORBIDDEN }));

    renderModal();

    expect(await screen.findByText(FORBIDDEN_MESSAGE)).toBeDefined();
    expect(screen.queryByText(GENERIC_ERROR_MESSAGE)).toBeNull();
    expect(screen.queryByTestId('pdfloader-stub')).toBeNull();
    expect(printButton()).toBeNull();
  });

  it('shows the generic error message and offers no print action when the request fails otherwise', async () => {
    mockGet.mockRejectedValue(new Error('Internal server error'));

    renderModal();

    expect(await screen.findByText(GENERIC_ERROR_MESSAGE)).toBeDefined();
    expect(screen.queryByText(FORBIDDEN_MESSAGE)).toBeNull();
    expect(screen.queryByTestId('pdfloader-stub')).toBeNull();
    expect(printButton()).toBeNull();
  });

  it('shows the preview and offers the print action once the sheet loads', async () => {
    mockGet.mockResolvedValue({ columns: [], hospitalTotals: {}, areas: [] });

    renderModal();

    expect(await screen.findByTestId('pdfloader-stub')).toBeDefined();
    await waitFor(() => expect(printButton()).not.toBeNull());
    expect(screen.queryByText(FORBIDDEN_MESSAGE)).toBeNull();
    expect(screen.queryByText(GENERIC_ERROR_MESSAGE)).toBeNull();
  });
});
