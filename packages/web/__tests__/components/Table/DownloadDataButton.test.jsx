import * as React from 'react';
import { assert, describe, it, vi } from 'vitest';
import { createTheme } from '@material-ui/core/styles';
import { render as baseRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { DownloadDataButton } from '../../../app/components/Table/DownloadDataButton';
import { TranslationContext } from '../../../app/contexts/Translation';
import * as XLSX from 'xlsx';
import { sex } from '../../../app/views/patients/columns';

/** Dictionary mapping string IDs to translations. */
const translatedStrings = {
  'general.localisedField.culturalName.label.short': '🌐 Cultural name 🌐',
  'general.localisedField.displayId.label.short': '🌐 NHN 🌐',
  'general.localisedField.firstName.label': '🌐 First name 🌐',
  'general.localisedField.sex.label': '🌐 Sex 🌐',
  'general.table.action.export': '🌐 Export 🌐',
  'patient.property.sex.female': '🌐 Female 🌐',
  'patient.property.sex.male': '🌐 Male 🌐',
  'patient.property.sex.other': '🌐 Other 🌐',
  'refData.settlement.settlement-nabualau': '🌐 Nabualau 🌐',
  'refData.settlement.settlement-nasaga': '🌐 Nasaga 🌐',
};

/** Stub `saveFile` to prevent `URL.createObjectURL` erroring in test environment */
vi.mock('../../../app/utils/fileSystemAccess.js', async () => {
  const actual = await vi.importActual('../../../app/utils/fileSystemAccess.js');
  return {
    ...actual,
    saveFile: vi.fn().mockImplementation(() => {}),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
const stubTheme = createTheme({});
// eslint-disable-next-line no-unused-vars
const mockGetTranslation = (stringId, fallback, _replacements, _uppercase, _lowercase) =>
  translatedStrings[stringId] ?? fallback;
const mockTranslationContext = {
  getTranslation: vi.fn().mockImplementation(mockGetTranslation),
  updateStoredLanguage: () => {},
  storedLanguage: 'aa',
  translations: [],
};

const getTranslationSpy = vi.spyOn(mockTranslationContext, 'getTranslation');
const sheetToJsonSpy = vi.spyOn(XLSX.utils, 'json_to_sheet');

/** The “minimum” context providers needed to render the component under test. */
const Providers = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={stubTheme}>
      <TranslationContext.Provider value={mockTranslationContext}>
        {children}
      </TranslationContext.Provider>
    </ThemeProvider>
  </QueryClientProvider>
);

/** {@link DownloadDataButton} must  be rendered within a translation context */
const render = (element, options) => baseRender(element, { wrapper: Providers, ...options });

describe('DownloadDataButton', () => {
  beforeAll(() => {
    vi.doMock('@tanstack/react-query', async () => {
      const actual = await vi.importActual('@tanstack/react-query');
      return {
        ...actual,
        useQueryClient: vi.fn().mockReturnValue(queryClient),
      };
    });
    vi.doMock('../../../app/contexts/Translation.jsx', async () => {
      const actual = await vi.importActual('../../../app/contexts/Translation.jsx');
      return {
        ...actual,
        useTranslation: vi.fn().mockReturnValue(mockTranslationContext),
        TranslationProvider: ({ children }) => (
          <TranslationContext.Provider value={mockTranslationContext}>
            {children}
          </TranslationContext.Provider>
        ),
      };
    });
  });

  afterAll(() => {
    vi.doUnmock('@tanstack/react-query');
    vi.doUnmock('../../../app/contexts/Translation.jsx');
  });

  it('renders without throwing errors', async () => {
    const renderButton = () =>
      render(<DownloadDataButton exportName="Export" columns={[]} data={[]} />);

    assert.doesNotThrow(renderButton, Error);
  });

  it('is rendered with a translated button label', () => {
    render(<DownloadDataButton exportName="Export" columns={[]} data={[]} />);
    const button = screen.getByTestId('download-data-button');
    expect(getTranslationSpy).toHaveBeenCalledWith(
      'general.table.action.export',
      'Export',
      undefined,
      undefined,
      undefined,
    );
    expect(button.textContent).toBe('🌐 Export 🌐');
  });

  // it('transforms the data correctly for creating an XLSX worksheet', async () => {
  //   const user = userEvent.setup();
  //   const columns = [displayId, culturalName, dateOfBirth];
  //   const data = [
  //     {
  //       id: '409257d7-5d58-4684-8b32-3ad92cbe6a5e',
  //       displayId: 'ZZTC137803',
  //       culturalName: 'Edith',
  //       dateOfBirth: '1963-01-25',
  //     },
  //     {
  //       id: '4902c05e-468f-470d-93d1-90d0cc9e97bf',
  //       displayId: 'MEOO646402',
  //       culturalName: 'Oscar',
  //       dateOfBirth: '1956-04-10',
  //     },
  //   ];
  //   const expectedData = data.map(({ displayId, culturalName, dateOfBirth }) => ({
  //     "Mother's first name": culturalName,
  //     DOB: dateOfBirth,
  //     EIRN: displayId,
  //   }));
  //   const expectedOptions = { header: ['EIRN', "Mother's first name", 'DOB'] };
  //
  //   render(<DownloadDataButton columns={columns} data={data} exportName="Export" />);
  //   const button = screen.getByTestId('download-data-button');
  //   await user.click(button);
  //
  //   expect(sheetToJsonSpy).toHaveBeenCalledTimes(1);
  //   expect(sheetToJsonSpy).toHaveBeenCalledWith(expectedData, expectedOptions);
  // });

  it('exports <TranslatedText> as a translated string', () => {});

  it('exports <TranslatedReference> as a translated string', () => {});

  it('exports <TranslatedSex> as a translated string', async () => {
    const user = userEvent.setup();
    const columns = [sex];
    const data = [
      {
        id: '5d9bf276-c93e-4f23-b77a-e3509541b77b',
        sex: 'male',
        encounterId: 'bc86d214-de36-4363-b741-616086be76fe',
        encounterType: 'admission',
        markedForSync: true,
        displayId: 'MACF991194',
        firstName: 'Rahul',
        lastName: '2.9',
        dateOfBirth: '1995-07-11',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-07-02T00:38:04.377Z',
        updatedAt: '2024-07-02T00:38:04.377Z',
      },
      {
        id: '19324abf-b485-4184-8537-0a7fe4be1d0b',
        sex: 'other',
        encounterId: '31466555-fbd1-4d91-8e17-b5904acd9c4e',
        encounterType: 'admission',
        villageName: 'Nasaga',
        markedForSync: true,
        displayId: 'ZLTH247813',
        firstName: 'Roy',
        middleName: 'Ernest',
        lastName: 'Antonini',
        culturalName: 'Joe',
        dateOfBirth: '1981-10-27',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-07-09T03:19:02.708Z',
        villageId: 'village-Nasaga',
      },
      {
        id: 'b7800158-d575-415c-8a7a-cf97a2e1e63f',
        sex: 'female',
        encounterId: '4e5409e9-af66-45ad-b795-3289969ab350',
        encounterType: 'triage',
        villageName: 'Nabualau',
        markedForSync: true,
        displayId: 'SCGH129788',
        firstName: 'Margaret',
        middleName: 'Ruby',
        lastName: 'Ballard',
        culturalName: 'Willie',
        dateOfBirth: '1984-09-22',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2024-06-24T00:11:13.082Z',
        updatedAt: '2024-06-24T00:11:13.082Z',
        villageId: 'village-Nabualau',
      },
    ];
    const expectedData = [
      { '🌐 Sex 🌐': '🌐 Male 🌐' },
      { '🌐 Sex 🌐': '🌐 Other 🌐' },
      { '🌐 Sex 🌐': '🌐 Female 🌐' },
    ];
    const expectedOptions = { header: ['🌐 Sex 🌐'] };

    render(<DownloadDataButton columns={columns} data={data} exportName="Export" />);
    const button = screen.getByTestId('download-data-button');
    await user.click(button);

    // expect(getTranslationSpy).toHaveBeenCalledTimes(0);
    expect(sheetToJsonSpy).toHaveBeenCalledTimes(1);
    expect(sheetToJsonSpy).toHaveBeenCalledWith(expectedData, expectedOptions);
  });

  it('exports <TranslatedEnum> as a translated string', () => {});

  it('exports <LocationCell> as a translated string', () => {});

  it('exports <TranslatedText> wrapped in a tooltip without its tooltip', () => {});

  it('exports a non-<TranslatedText> faithfully', () => {});

  it('exports a primitive string faithfully', () => {});
});
