/*
 * The Generic Survey Export - Line List report names its downloaded file and metadata tab after the
 * survey being exported (spec: REPORTS). Other reports are named as before.
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';

import { GENERIC_SURVEY_EXPORT_REPORT_ID } from '@tamanu/constants';
import { renderElementWithTranslatedText } from '../../helpers';

const SURVEY_ID = 'program-test-survey';

vi.mock('../../../app/contexts/Auth', () => ({
  useAuth: () => ({
    currentUser: { email: 'clinician@example.com' },
    facilityId: 'facility-1',
  }),
}));

vi.mock('../../../app/contexts/Localisation', () => ({
  useLocalisation: () => ({
    getLocalisation: () => ({ id: 'country-1', name: 'Samoa' }),
  }),
}));

const { stubApi, prepareExcelFile } = vi.hoisted(() => ({
  stubApi: { get: vi.fn(), post: vi.fn() },
  prepareExcelFile: vi.fn(({ defaultFileName }) => ({
    defaultFileName,
    getData: () => new Uint8Array(0),
    extension: 'xlsx',
  })),
}));

vi.mock('../../../app/utils/saveExcelFile', () => ({ prepareExcelFile }));

vi.mock('@tamanu/ui-components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useApi: () => stubApi,
    useDateTime: () => ({
      primaryTimeZone: 'Pacific/Apia',
      facilityTimeZone: undefined,
      getCurrentDate: () => '2026-11-18',
      getFacilityNowDate: () => new Date('2026-11-18T09:00:00'),
    }),
  };
});

vi.mock('../../../app/components', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    // The real DateField mounts a MUI X date picker, which needs a LocalizationProvider.
    DateField: () => <div data-testid="datefield-stub" />,
    // A plain input stands in for the autocomplete, so a test can choose a value by its id.
    AutocompleteField: ({ field, onChange }) => (
      <input
        data-testid={`autocomplete-stub-${field.name}`}
        onChange={event =>
          (onChange ?? field.onChange)({ target: { name: field.name, value: event.target.value } })
        }
      />
    ),
  };
});

import { ReportGeneratorForm } from '../../../app/views/reports/ReportGeneratorForm';

const genericSurveyExport = {
  id: 'generic-survey-version-1',
  definitionId: GENERIC_SURVEY_EXPORT_REPORT_ID,
  name: 'Generic Survey Export - Line List',
  dataSourceOptions: ['thisFacility'],
  parameters: [
    {
      parameterField: 'ParameterAutocompleteField',
      label: 'Survey',
      name: 'surveyId',
      suggesterEndpoint: 'survey',
      required: true,
    },
  ],
};

const otherReport = {
  id: 'admissions-version-1',
  definitionId: 'admissions-report',
  name: 'Admissions Report',
  dataSourceOptions: ['thisFacility'],
  parameters: [],
};

const generateReport = async ({ reportId, surveyId }) => {
  renderElementWithTranslatedText(<ReportGeneratorForm />);

  fireEvent.change(await screen.findByTestId('autocomplete-stub-reportId'), {
    target: { value: reportId },
  });
  if (surveyId) {
    fireEvent.change(await screen.findByTestId('autocomplete-stub-surveyId'), {
      target: { value: surveyId },
    });
  }
  fireEvent.click(await screen.findByText('Generate as .XLSX'));

  await waitFor(() => expect(prepareExcelFile).toHaveBeenCalledTimes(1));
  return prepareExcelFile.mock.calls[0][0];
};

describe('ReportGeneratorForm survey name', () => {
  beforeEach(() => {
    prepareExcelFile.mockClear();
    stubApi.post.mockResolvedValue([['Header'], ['Row']]);
    stubApi.get.mockImplementation(async url => {
      if (url === 'reports') return [genericSurveyExport, otherReport];
      // The survey suggester resolves its label in the user's language on the server
      if (url === `suggestions/survey/${SURVEY_ID}`) {
        return { id: SURVEY_ID, name: 'Informations patient' };
      }
      return [];
    });
  });

  it('names a Generic Survey export after its survey, between the report and country names', async () => {
    const { defaultFileName } = await generateReport({
      reportId: genericSurveyExport.id,
      surveyId: SURVEY_ID,
    });

    expect(defaultFileName).toBe(
      'report-2026-11-18-generic-survey-export-line-list-informations-patient-samoa',
    );
  });

  it('adds a Survey row after Filters and before Timezone on the metadata tab', async () => {
    const { metadata } = await generateReport({
      reportId: genericSurveyExport.id,
      surveyId: SURVEY_ID,
    });

    expect(metadata.map(([label]) => label)).toEqual([
      'Report Name:',
      'Date Generated:',
      'User:',
      'Filters:',
      'Survey:',
      'Timezone:',
    ]);
    expect(metadata[3][1]).toContain(`surveyId: ${SURVEY_ID}`);
    expect(metadata[4][1]).toBe('Informations patient');
  });

  it('names other reports without a survey', async () => {
    const { defaultFileName, metadata } = await generateReport({ reportId: otherReport.id });

    expect(defaultFileName).toBe('report-2026-11-18-admissions-report-samoa');
    expect(metadata.map(([label]) => label)).not.toContain('Survey:');
  });
});
