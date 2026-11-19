/*
 * The report generator's "This facility / All facilities" choice in
 * packages/web/app/views/reports/ReportGeneratorForm.jsx.
 *
 * A report that allows both data sources shows the choice. A report that allows only one hides
 * it, and still generates from the one source it allows.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { REPORT_DATA_SOURCES } from '@tamanu/constants';

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

const REPORTS = [
  { id: 'both-sources', name: 'Both sources report' },
  {
    id: 'this-facility-only',
    name: 'This facility only report',
    dataSourceOptions: [REPORT_DATA_SOURCES.THIS_FACILITY],
  },
  {
    id: 'all-facilities-only',
    name: 'All facilities only report',
    dataSourceOptions: [REPORT_DATA_SOURCES.ALL_FACILITIES],
  },
];

const { stubApi, nextReportIdRef } = vi.hoisted(() => ({
  stubApi: { get: vi.fn(), post: vi.fn() },
  nextReportIdRef: { current: null },
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
      getFacilityNowDate: () => new Date('2026-07-13T09:00:00'),
    }),
  };
});

vi.mock('../../../app/components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    // The real report picker is a MUI autocomplete; a button that picks the next report keeps
    // the test on the data source behaviour rather than on driving the autocomplete.
    AutocompleteField: ({ onChange, field }) => (
      <button
        type="button"
        data-testid="report-picker-stub"
        onClick={() => onChange({ target: { name: field.name, value: nextReportIdRef.current } })}
      >
        pick report
      </button>
    ),
    // The real DateField mounts a MUI X date picker, which needs a LocalizationProvider.
    DateField: () => <div data-testid="datefield-stub" />,
  };
});

vi.mock('../../../app/utils/saveExcelFile', () => ({
  prepareExcelFile: () => ({ getData: () => new Uint8Array(2048) }),
}));

import { ReportGeneratorForm } from '../../../app/views/reports/ReportGeneratorForm';

const pickReport = reportId => {
  nextReportIdRef.current = reportId;
  fireEvent.click(screen.getByTestId('report-picker-stub'));
};

const dataSourceField = () => screen.queryByTestId('field-ran8');

const generate = () => fireEvent.click(screen.getByTestId('mainbuttoncomponent-xdka'));

describe('ReportGeneratorForm data source choice', () => {
  beforeEach(() => {
    stubApi.get.mockReset();
    stubApi.post.mockReset();
    stubApi.get.mockImplementation(async url => (url === 'reports' ? REPORTS : []));
    stubApi.post.mockResolvedValue([['heading'], ['row']]);
  });

  const renderForm = async () => {
    renderElementWithTranslatedText(<ReportGeneratorForm />);
    await screen.findByTestId('report-picker-stub');
    await waitFor(() => expect(stubApi.get).toHaveBeenCalledWith('reports'));
  };

  it('shows both options for a report that allows both data sources', async () => {
    await renderForm();
    pickReport('both-sources');

    const field = dataSourceField();
    expect(field).not.toBeNull();
    expect(field.textContent).toContain('This facility');
    expect(field.textContent).toContain('All facilities');
    for (const radio of field.querySelectorAll('input[type="radio"]')) {
      expect(radio.disabled).toBe(false);
    }
  });

  it('hides the choice for a this-facility-only report and generates from this facility', async () => {
    await renderForm();
    pickReport('this-facility-only');

    expect(dataSourceField()).toBeNull();
    expect(screen.queryByTestId('emailfield-t4vt')).toBeNull();

    generate();

    await waitFor(() => expect(stubApi.post).toHaveBeenCalledTimes(1));
    const [url, body] = stubApi.post.mock.calls[0];
    expect(url).not.toBe('reportRequest');
    expect(body).toMatchObject({ facilityId: 'facility-1' });
    expect(await screen.findByTestId('button-f4xo')).toBeTruthy();
  });

  it('hides the choice for an all-facilities-only report and queues an emailed request', async () => {
    await renderForm();
    pickReport('all-facilities-only');

    expect(dataSourceField()).toBeNull();
    expect(await screen.findByTestId('emailfield-t4vt')).toBeTruthy();

    generate();

    await waitFor(() => expect(stubApi.post).toHaveBeenCalledTimes(1));
    const [url, body] = stubApi.post.mock.calls[0];
    expect(url).toBe('reportRequest');
    expect(body).toMatchObject({
      reportId: 'all-facilities-only',
      emailList: ['clinician@example.com'],
    });
    expect(await screen.findByTestId('alert-vt6q')).toBeTruthy();
  });

  it('shows the choice again when switching from a single-source report to a two-source one', async () => {
    await renderForm();

    pickReport('this-facility-only');
    expect(dataSourceField()).toBeNull();

    pickReport('both-sources');
    expect(dataSourceField()).not.toBeNull();

    pickReport('all-facilities-only');
    expect(dataSourceField()).toBeNull();

    pickReport('both-sources');
    expect(dataSourceField()).not.toBeNull();
  });
});
