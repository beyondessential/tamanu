import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { createTheme } from '@material-ui/core/styles';
import { AuthContext, DateTimeProvider, SettingsContext } from '@tamanu/ui-components';
import { TranslationProvider } from '../../app/contexts/Translation';

// Stand in for the label print screen so the test can assert when it opens and with which requests,
// without the patient/print contexts the real modal needs.
vi.mock('../../app/components/PatientPrinting/modals/LabRequestPrintLabelModal', () => ({
  LabRequestPrintLabelModal: ({ open, labRequests }) =>
    open ? <div data-testid="label-print-screen">{labRequests.length}</div> : null,
  toLabelData: () => ({}),
}));
vi.mock('../../app/components/PatientPrinting/modals/MultipleLabRequestsPrintoutModal', () => ({
  MultipleLabRequestsPrintoutModal: () => null,
}));
// The manual "Print labels" button prints through this hidden frame; stub it so the test needs no
// real iframe, and expose the print handle it calls.
vi.mock('../../app/components/PatientPrinting/printouts/LabRequestLabelPrintFrame', async () => {
  const react = await import('react');
  return {
    LabRequestLabelPrintFrame: react.forwardRef((_props, ref) => {
      react.useImperativeHandle(ref, () => ({ print: () => {} }));
      return null;
    }),
  };
});
vi.mock('../../app/contexts/Patient', () => ({
  usePatient: () => ({ patient: { id: 'pat-1', displayId: 'PID1', dateOfBirth: '2000-01-01' } }),
}));
vi.mock('../../app/api/queries/useLabRequestNotesQuery', () => ({
  useLabRequestNotesQuery: () => ({ data: { data: [] }, isLoading: false }),
}));

import { LabRequestSummaryPane } from '../../app/views/patients/components/LabRequestSummaryPane';

const CATEGORY = { id: 'cat-1', name: 'Haematology', type: 'labTestCategory' };

const recorded = id => ({ id, displayId: id, category: CATEGORY, sampleTime: '2026-01-01 09:23:00' });
const notCollected = id => ({ id, displayId: id, category: CATEGORY, sampleTime: null });

const AUTO_PRINT_KEY = 'labs.autoPrintSampleLabel';

const translationContext = {
  getTranslation: (_id, fallback) => fallback,
  updateStoredLanguage: () => {},
  storedLanguage: 'en',
  translations: {},
};

const renderPane = ({ labRequests, settings = {} }) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ThemeProvider theme={createTheme({})}>
        <TranslationProvider value={translationContext}>
          <AuthContext.Provider value={{ primaryTimeZone: 'Pacific/Auckland' }}>
            <SettingsContext.Provider value={{ getSetting: key => settings[key] }}>
              <DateTimeProvider>
                <LabRequestSummaryPane
                  encounter={{ id: 'enc-1' }}
                  labRequests={labRequests}
                  onClose={() => {}}
                />
              </DateTimeProvider>
            </SettingsContext.Provider>
          </AuthContext.Provider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

describe('LabRequestSummaryPane', () => {
  it('pre-selects recorded samples and leaves every row selectable', () => {
    renderPane({ labRequests: [recorded('COLL01'), notCollected('UNCOLL1')] });
    // DOM order: [0] header select-all, [1] recorded row, [2] not-collected row.
    const [, collected, uncollected] = screen.getAllByRole('checkbox');
    expect(collected.checked).toBe(true);
    // A row without a recorded sample starts unselected but can still be selected.
    expect(uncollected.disabled).toBe(false);
    expect(uncollected.checked).toBe(false);
  });

  it('select-all selects every row, including those without a recorded sample', () => {
    renderPane({ labRequests: [recorded('COLL01'), notCollected('UNCOLL1')] });
    const selectAll = () => screen.getAllByRole('checkbox')[0];
    const uncollected = () => screen.getAllByRole('checkbox')[2];
    expect(uncollected().checked).toBe(false);
    fireEvent.click(selectAll()); // selects every row
    expect(uncollected().checked).toBe(true);
  });

  it('printing labels manually does not open the label print screen', () => {
    renderPane({ labRequests: [recorded('COLL01')] });
    fireEvent.click(screen.getByTestId('outlinedbutton-skm0'));
    expect(screen.queryByTestId('label-print-screen')).toBeNull();
  });

  it('auto-opens the label print screen when enabled and every sample is recorded', () => {
    renderPane({
      labRequests: [recorded('COLL01'), recorded('COLL02')],
      settings: { [AUTO_PRINT_KEY]: true },
    });
    const screenMarker = screen.getByTestId('label-print-screen');
    expect(screenMarker).toBeTruthy();
    // Every request is offered for printing, not just the table's pre-selected rows.
    expect(screenMarker.textContent).toBe('2');
  });

  it('does not auto-open when the setting is off', () => {
    renderPane({ labRequests: [recorded('COLL01'), recorded('COLL02')] });
    expect(screen.queryByTestId('label-print-screen')).toBeNull();
  });

  it('does not auto-open when some samples are not recorded, even if enabled', () => {
    renderPane({
      labRequests: [recorded('COLL01'), notCollected('UNCOLL1')],
      settings: { [AUTO_PRINT_KEY]: true },
    });
    expect(screen.queryByTestId('label-print-screen')).toBeNull();
  });
});
