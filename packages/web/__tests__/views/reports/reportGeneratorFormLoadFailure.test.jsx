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
import { screen, waitFor } from '@testing-library/react';

import { renderElementWithTranslatedText } from '../../helpers';

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
});
