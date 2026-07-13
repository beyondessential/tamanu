/*
 * Regression test for the report-list load-failure message in
 * packages/web/app/views/reports/ReportGeneratorForm.jsx.
 *
 * When `api.get('reports')` fails, the error message was built by interpolating
 * a <TranslatedText> React element directly into a template literal, so the
 * user saw "[object Object] - <error message>" instead of the intended
 * explanation.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';

import { createQueryClient, createStubTheme, renderElementWithTranslatedText } from '../../helpers';
import { TranslationProvider } from '../../../app/contexts/Translation';

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({
    currentUser: { email: 'clinician@example.com' },
    facilityId: 'facility-1',
  }),
}));

vi.mock('../../../app/contexts/Localisation', () => ({
  useLocalisation: () => ({
    getLocalisation: () => ({ id: 'country-1', name: 'Testland' }),
  }),
}));

const { stubApi } = vi.hoisted(() => ({
  stubApi: {
    get: vi.fn(async url => {
      if (url === 'reports') {
        throw new Error('Network unavailable');
      }
      return [];
    }),
  },
}));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => stubApi,
    useDateTime: () => ({
      primaryTimeZone: 'Pacific/Auckland',
      facilityTimeZone: undefined,
      getCurrentDate: () => '2026-07-13',
    }),
  };
});

vi.mock('../../../app/components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    // The real DateField mounts a MUI X date picker, which needs a
    // LocalizationProvider we have no reason to set up for this test; stub it
    // out so the form can render without it.
    DateField: () => <div data-testid="datefield-stub" />,
  };
});

import { ReportGeneratorForm } from '../../../app/views/reports/ReportGeneratorForm';

describe('ReportGeneratorForm load failure message', () => {
  it('renders the explanatory text without "[object Object]"', async () => {
    renderElementWithTranslatedText(<ReportGeneratorForm />);

    const alert = await screen.findByTestId('alert-us27');

    await waitFor(() => expect(alert.textContent).toContain('Unable to load available reports'));

    expect(alert.textContent).not.toContain('[object Object]');
    expect(alert.textContent).toContain('Network unavailable');
  });

  it('clears a previous load-failure alert once the reports fetch is re-run and succeeds', async () => {
    // The reports-fetch effect depends on `getTranslation`, so it re-runs whenever
    // that reference changes (e.g. once translations finish loading). Simulate
    // that by swapping the translation context's `getTranslation` identity
    // between renders, driven by a mutable holder the wrapper re-reads on
    // every render pass.
    const makeTranslationContext = () => ({
      getTranslation: (_stringId, fallback) => fallback,
      updateStoredLanguage: () => {},
      storedLanguage: 'aa',
      translations: {},
    });
    const translationContextHolder = { current: makeTranslationContext() };

    const Wrapper = ({ children }) => (
      <QueryClientProvider client={createQueryClient()}>
        <ThemeProvider theme={createStubTheme()}>
          <TranslationProvider value={translationContextHolder.current}>
            {children}
          </TranslationProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );

    let reportsFetchCount = 0;
    stubApi.get.mockImplementation(async url => {
      if (url === 'reports') {
        reportsFetchCount += 1;
        if (reportsFetchCount === 1) {
          throw new Error('Network unavailable');
        }
        return [{ id: 'report-1', name: 'Test report' }];
      }
      return [];
    });

    const { rerender } = render(<ReportGeneratorForm />, { wrapper: Wrapper });

    const alert = await screen.findByTestId('alert-us27');
    await waitFor(() => expect(alert.textContent).toContain('Network unavailable'));

    // Simulate translations finishing loading and force a re-render so the
    // effect picks up the new `getTranslation` reference and re-fetches.
    translationContextHolder.current = makeTranslationContext();
    rerender(<ReportGeneratorForm />);

    await waitFor(() => expect(reportsFetchCount).toBe(2));
    await waitFor(() => expect(screen.queryByTestId('alert-us27')).toBeNull());
  });
});
